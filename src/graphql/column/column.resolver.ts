import {SQL} from '../../database/Connection';
import {pubsub} from "../context";
import {Row, RowList} from "postgres";

const resolver = {
    Column: {
        cards(parent) {
            return SQL`
                SELECT card_uuid as uuid, name, description, story_points, creation_timestamp as created, "order"
                FROM core.cards
                WHERE column_uuid = ${parent.uuid}
                ORDER BY "order"`;
        },
    },
};

const mutation = {
    ColumnMutation: {
        async create(_, {name, type, description, project_uuid}) {
            const result = await SQL`
                INSERT INTO core.columns(name, type, description, project_uuid)
                VALUES (${name || null},
                        ${type || null},
                        ${description || null},
                        ${project_uuid})
                RETURNING column_uuid as uuid, name, type, description, "order"`;

            const column = result[0];
            column.cards = [];

            void pubsub.publish("column_created", {column_created: column});
            return column;
        },

        async update(_, {uuid, name, type, description}) {
            const result = await SQL`
                UPDATE core.columns
                SET name        = ${name === undefined ? SQL`name` : name},
                    type        = ${type === undefined ? SQL`type` : type},
                    description = ${description === undefined ? SQL`description` : description}
                WHERE column_uuid = ${uuid}
                RETURNING column_uuid AS uuid, name, "order", type, description, project_uuid`;

            const column = result[0]
            void pubsub.publish("column_updated", column);
            return column;
        },

        async move(_, {uuid_from, uuid_to}) {
            const orderResult = await SQL`
                SELECT column_uuid, "order"
                FROM core.columns
                WHERE column_uuid IN (${uuid_from}, ${uuid_to});`;


            const fromOrder = orderResult.find(r => r.column_uuid == uuid_from).order
            const toOrder = orderResult.find(r => r.column_uuid == uuid_to).order

            const moveForward = toOrder > fromOrder;

            let columns: RowList<Row[]>

            if (moveForward) {
                columns = await SQL`
                    WITH temp AS (
                        SELECT
                            (SELECT "order" FROM core.columns WHERE column_uuid = ${uuid_from}) AS start_order,
                            (SELECT "order" FROM core.columns WHERE column_uuid = ${uuid_to}) AS end_order,
                            (SELECT project_uuid FROM core.columns WHERE column_uuid = ${uuid_to}) AS project_uuid
                    )
                    
                    UPDATE core.columns AS c
                    SET
                        "order" = COALESCE(
                            CASE
                                WHEN c."order" BETWEEN (SELECT start_order FROM temp) AND (SELECT end_order FROM temp)
                                THEN
                                    CASE
                                        WHEN c."order" = (SELECT start_order FROM temp)
                                        THEN (SELECT end_order FROM temp)
                                        ELSE (
                                            SELECT COALESCE(MAX("order"), 0)
                                            FROM core.columns
                                            WHERE "order" < c."order"
                                        )
                                    END
                                ELSE c."order"
                            END,
                            (SELECT COALESCE(MAX("order"), 0) FROM core.columns)
                      )::integer
                    WHERE "project_uuid" = (SELECT project_uuid FROM temp)
                    RETURNING column_uuid as uuid, name, type, description, "order";
                `;
            } else {
                columns = await SQL`
                    WITH temp AS (
                        SELECT
                            (SELECT "order" FROM core.columns WHERE column_uuid = ${uuid_from}) AS start_order,
                            (SELECT "order" FROM core.columns WHERE column_uuid = ${uuid_to}) AS end_order,
                            (SELECT project_uuid FROM core.columns WHERE column_uuid = ${uuid_to}) AS project_uuid
                    )
                    
                    UPDATE core.columns AS c
                    SET
                        "order" = COALESCE(
                            CASE
                                WHEN c."order" BETWEEN (SELECT end_order FROM temp) AND (SELECT start_order FROM temp)
                                THEN
                                    CASE
                                        WHEN c."order" = (SELECT start_order FROM temp)
                                        THEN (SELECT end_order FROM temp)
                                        ELSE (
                                            SELECT COALESCE(MIN("order"), 0)
                                            FROM core.columns
                                            WHERE "order" > c."order"
                                        )
                                    END
                                ELSE c."order"
                            END,
                            (SELECT MIN("order") FROM core.columns)
                        )::integer
                    WHERE "project_uuid" = (SELECT project_uuid FROM temp)
                    RETURNING column_uuid as uuid, name, type, description, "order";
                  `;
            }

            await Promise.all(columns.map(async (column) => {
                column.cards = await resolver.Column.cards(column)
            }));

            console.log(columns)

            void pubsub.publish("column_updated", { column_updated: columns});
            return columns
        },

        async delete(_, {uuid}) {
            const result = await SQL`
                DELETE
                FROM core.columns
                WHERE column_uuid = ${uuid}
                RETURNING column_uuid`;

            if (result.length !== 1) {
                return null;
            }

            void pubsub.publish("column_deleted", {column_deleted: uuid});
            return uuid;
        },
    },
};

const subscription = {
    column_created: {
        subscribe: () => pubsub.asyncIterator(['column_created'])
    },
    column_updated: {
        subscribe: () => pubsub.asyncIterator(['column_updated'])
    },
    column_deleted: {
        subscribe: () => pubsub.asyncIterator(['column_deleted'])
    },
}

export {resolver, mutation, subscription}