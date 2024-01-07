import { SQL } from '../../database/Connection';
import { pubsub } from "../context";

const resolver = {
  Card: {
    assignees(parent) {
      return SQL`
          SELECT card_uuid as uuid, auth.users.name as name, email, image, creation_timestamp as created
          FROM core.cards
              JOIN core.card_users USING (card_uuid)
              JOIN auth.users ON core.card_users.user_uuid = auth.users.id
          WHERE card_uuid = ${parent.uuid}`;
    },
    async deadline(parent) {
      const result = await SQL`
          SELECT value
          FROM core.cards
              JOIN core.date_values USING (card_uuid)
              JOIN core.fields USING (field_uuid)
          WHERE card_uuid = ${parent.uuid}
            AND role = 'deadline'`;

      return result[0]?.value;
    },
    // TODO this shouldn't be copy pasted from cardDetails.resolver.ts
    tags(parent) {
      return SQL`
          SELECT select_option_uuid as uuid, value, color
          FROM core.cards
              JOIN core.select_values USING (card_uuid)
              JOIN core.select_options USING (select_option_uuid)
              JOIN core.fields ON core.fields.field_uuid = select_values.field_uuid
          WHERE card_uuid = ${parent.uuid}
            AND role = 'tags'`;
    },
    // TODO this shouldn't be copy pasted from cardDetails.resolver.ts
    async milestone(parent) {
      const result = await SQL`
          SELECT milestone_uuid as uuid, milestones.name, milestones.creation_timestamp, deadline
          FROM core.milestones
              JOIN core.cards USING (milestone_uuid)
          WHERE card_uuid = ${parent.uuid}`;

      return result[0]
    },
    async column(parent) {
      const result = await SQL`
          SELECT columns.name, columns.order, columns.type, columns.description, column_uuid as uuid, project_uuid
          FROM core.columns
              JOIN core.cards USING (column_uuid)
          WHERE card_uuid = ${parent.uuid}`;

      return result[0]
    },
  },
};


// TODO
//  update_select_field select could require separate function
const update_field = async (_, { card_uuid, field_uuid, value }) => {
  void pubsub.publish("card_updated", {});
}

const mutation = {
  CardsMutation: {
    // TODO await all promises at the end or when needed and not every time.
    //  Best if there would be less than 10 separate queries.
    //  All inserts should also be only one transaction
    async create(_, { name, description, story_points, column_uuid, milestone_uuid, assignee_uuids, deadline, tag_uuids }) {
      const result = await SQL`
        INSERT INTO core.cards(name, description, story_points, column_uuid, milestone_uuid)
        VALUES (
            ${name || null},
            ${description || null},
            ${story_points || null},
            ${column_uuid || null},
            ${milestone_uuid || null}
          )
        RETURNING card_uuid as uuid, name, description, story_points, creation_timestamp as created, "order"`;

      const card = result[0];

      if (assignee_uuids != null) {
        const card_users = assignee_uuids.map( assignee_uuid => {
          return {
            user_uuid: assignee_uuid,
            card_uuid: card.uuid,
          }
        })
        await SQL`INSERT INTO core.card_users ${SQL(card_users)}`
      }

      if (deadline != null) {
        await SQL`
          INSERT INTO core.date_values (value, card_uuid, field_uuid)
          SELECT ${deadline}, ${card.uuid}, field_uuid
          FROM core.fields
            JOIN core.columns USING (project_uuid)
            JOIN core.cards USING (column_uuid)
          WHERE card_uuid = ${card.uuid}
            AND role = 'deadline'`
      }

      if (tag_uuids != null) {
        const tagsFieldUUIDResult = await SQL`SELECT field_uuid
          FROM core.fields
            JOIN core.columns USING (project_uuid)
            JOIN core.cards USING (column_uuid)
          WHERE card_uuid = ${card.uuid}
            AND role = 'tags'`
        const tagsFieldUUID = tagsFieldUUIDResult[0].field_uuid
        const tagUUIDs = tag_uuids.map( tag_uuid => {
          return {
            card_uuid: card.uuid,
            field_uuid: tagsFieldUUID,
            select_option_uuid: tag_uuid,
          }
        })
        await SQL`INSERT INTO core.select_values ${SQL(tagUUIDs)}`
      }

      card.assignees = await resolver.Card.assignees(card)
      card.deadline = await resolver.Card.deadline(card)
      card.tags = await resolver.Card.tags(card)
      card.milestone = await resolver.Card.milestone(card)
      card.column = await resolver.Card.column(card)
      void pubsub.publish("card_created", { card_created: card });
      return card;
    },

    async delete(_, { uuid }) {
      const result = await SQL.begin(async SQL => {
        await SQL`
          DELETE FROM core.card_users
          WHERE card_uuid = ${uuid}`

        await SQL`
          DELETE FROM core.checkbox_values
          WHERE card_uuid = ${uuid}`

        await SQL`
          DELETE FROM core.date_values
          WHERE card_uuid = ${uuid}`

        await SQL`
          DELETE FROM core.number_values
          WHERE card_uuid = ${uuid}`

        await SQL`
          DELETE FROM core.select_values
          WHERE card_uuid = ${uuid}`

        const result = await SQL`
        DELETE FROM core.cards
        WHERE card_uuid = ${uuid}
        RETURNING card_uuid as uuid`;

        return result
      })

      if (result.length !== 1) {
        return null;
      }

      pubsub.publish("card_deleted", { card_deleted: result[0].uuid });

      return result[0].uuid
    },

    // TODO
    async update_details(_, { uuid, name, description, story_points, assignee_uuids, deadline, tag_uuids, milestone_uuid, column_uuid }) {
      const result = await SQL`
        UPDATE core.cards
        SET
          name = ${name === undefined ? SQL`name` : name},
          description = ${description === undefined ? SQL`description` : description},
          story_points = ${story_points === undefined ? SQL`story_points` : story_points},
          column_uuid = ${column_uuid === undefined ? SQL`column_uuid` : column_uuid},
          milestone_uuid = ${milestone_uuid === undefined ? SQL`milestone_uuid` : milestone_uuid}
        WHERE card_uuid = ${uuid}
        RETURNING card_uuid as uuid, name, description, story_points, creation_timestamp as created, "order"`;
      const card = result[0];


      if (deadline !== undefined) {
        if (deadline === null) {
          await SQL`
            DELETE FROM core.date_values
            WHERE card_uuid = ${uuid}`
        } else {
          await SQL`
            UPDATE core.date_values
            SET value = ${deadline}
            WHERE card_uuid = ${card.uuid}
              AND field_uuid IN (
                SELECT field_uuid
                FROM core.fields
                  JOIN core.columns USING (project_uuid)
                  JOIN core.cards USING (column_uuid)
                WHERE card_uuid = ${card.uuid}
                  AND role = 'deadline'
              )
             `
        }
      }

      if (assignee_uuids !== undefined) {
        if (assignee_uuids === null || assignee_uuids.length == 0) {
          await SQL`
            DELETE FROM core.card_users
            WHERE card_uuid = ${card.uuid}`
        } else {
          // Transaction
          await SQL.begin(async SQL => {
            await SQL`
              DELETE FROM core.card_users
              WHERE card_uuid = ${card.uuid}
                AND user_uuid NOT IN ${SQL(assignee_uuids)}`

            const card_users = assignee_uuids.map( assignee_uuid => {
              return {
                user_uuid: assignee_uuid,
                card_uuid: card.uuid,
              }
            })
            await SQL`INSERT INTO core.card_users ${SQL(card_users)} ON CONFLICT DO NOTHING`
          })
        }
      }

      if (tag_uuids !== undefined) {
        const tagsFieldUUIDResult = await SQL`SELECT field_uuid
          FROM core.fields
            JOIN core.columns USING (project_uuid)
            JOIN core.cards USING (column_uuid)
          WHERE card_uuid = ${card.uuid}
            AND role = 'tags'`
        const tagsFieldUUID = tagsFieldUUIDResult[0].field_uuid
        if (tag_uuids === null || tag_uuids.length == 0) {
          await SQL`
            DELETE FROM core.select_values
            WHERE card_uuid = ${card.uuid}`
        } else {
          await SQL.begin(async SQL => {
            console.log("a")
            console.log(tagsFieldUUID)
            await SQL`
              DELETE FROM core.select_values
              WHERE card_uuid = ${card.uuid}
                AND field_uuid = ${tagsFieldUUID}`

            const tagUUIDs = tag_uuids.map( tag_uuid => {
              return {
                card_uuid: card.uuid,
                field_uuid: tagsFieldUUID,
                select_option_uuid: tag_uuid,
              }
            })
            await SQL`INSERT INTO core.select_values ${SQL(tagUUIDs)} ON CONFLICT DO NOTHING`
          })
        }
      }

      card.assignees = await resolver.Card.assignees(card)
      card.deadline = await resolver.Card.deadline(card)
      card.tags = await resolver.Card.tags(card)
      card.milestone = await resolver.Card.milestone(card)
      card.column = await resolver.Card.column(card)

      void pubsub.publish("card_updated", {card_updated: card});

      return card
    },

    async move(_, { uuid_from, uuid_to }) {
      const orderResult = await SQL`
                SELECT card_uuid, "order", column_uuid
                FROM core.cards
                WHERE card_uuid IN (${uuid_from}, ${uuid_to});`;

      console.log(orderResult)

      const fromOrder = orderResult.find(r => r.uuid == uuid_from)
      const toOrder = orderResult.find(r => r.uuid == uuid_to)

      const moveForward = toOrder > fromOrder;

      const differentColumn = orderResult[0].column_uuid != orderResult[1].column_uuid

      await SQL.begin(async SQL => {
        if (differentColumn) {
          // Set order to max order of target column + 1 and perform shift as usual
          await SQL`
            UPDATE core.cards
            SET
                "order" = (
                    SELECT MAX("order") + 1
                    FROM core.cards
                    WHERE card_uuid = ${uuid_to}
                ),
                column_uuid = (
                    SELECT column_uuid
                    FROM core.cards
                    WHERE card_uuid = ${uuid_to}
                )
            WHERE card_uuid = ${uuid_from};
          `;
        }

        if (moveForward) {
          await SQL`
          WITH temp AS (
              SELECT
                  (SELECT "order" FROM core.cards WHERE card_uuid = ${uuid_from}) AS start_order,
                  (SELECT "order" FROM core.cards WHERE card_uuid = ${uuid_to}) AS end_order,
                  (SELECT "column_uuid" FROM core.cards WHERE card_uuid = ${uuid_to}) AS target_column
          )
          
          UPDATE core.cards AS c
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
                                  FROM core.cards
                                  WHERE "order" < c."order" AND "column_uuid" = (SELECT target_column FROM temp)
                              )
                          END
                      ELSE c."order"
                  END,
                  (SELECT COALESCE(MAX("order"), 0) FROM core.cards)
            )::integer
          WHERE "column_uuid" = (SELECT target_column FROM temp);
      `;
        } else {
          await SQL`
          WITH temp AS (
              SELECT
                  (SELECT "order" FROM core.cards WHERE card_uuid = ${uuid_from}) AS start_order,
                  (SELECT "order" FROM core.cards WHERE card_uuid = ${uuid_to}) AS end_order,
                  (SELECT "column_uuid" FROM core.cards WHERE card_uuid = ${uuid_to}) AS target_column
          )
          
          UPDATE core.cards AS c
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
                                  FROM core.cards
                                  WHERE "order" > c."order" AND "column_uuid" = (SELECT target_column FROM temp)
                              )
                          END
                      ELSE c."order"
                  END,
                  (SELECT MIN("order") FROM core.cards)
              )::integer
          WHERE "column_uuid" = (SELECT target_column FROM temp);
        `;
        }

      })
      // TODO What should subscription return? Array of two cards?
      void pubsub.publish("card_updated", {});
    },

    async move_to_column(_, { card_uuid, column_uuid }) {
        await SQL`
            UPDATE core.cards
            SET 
                column_uuid = ${column_uuid},
                "order" = (
                    SELECT COALESCE(MAX("order") + 1, 0)
                    FROM core.columns
                    WHERE columns.column_uuid = ${column_uuid}
                )
            WHERE card_uuid = ${card_uuid};
        `;
      // TODO What should subscription return? Array of two cards?
      void pubsub.publish("card_updated", {});
    },


    update_text_field: async (parent, input) => update_field(parent, input),
    update_number_field: async (parent, input) => update_field(parent, input),
    update_checkbox_field: async (parent, input) => update_field(parent, input),
    update_date_field: async (parent, input) => update_field(parent, input),
    update_select_field: async (parent, input) => update_field(parent, input),
  },
};

const subscription = {
  card_created: {
    subscribe: () => pubsub.asyncIterator(['card_created'])
  },
  card_updated: {
    subscribe: () => pubsub.asyncIterator(['card_updated'])
  },
  card_deleted: {
    subscribe: () => pubsub.asyncIterator(['card_deleted'])
  },
}

export {resolver, mutation, subscription}