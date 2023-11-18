import { SQL } from '../../database/Connection';
import {pubsub} from "../context";

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
    async create(_, { name, type, description, project_uuid }) {
      const result = await SQL`
        INSERT INTO core.columns(name, type, description, project_uuid)
        VALUES (
          ${name || null},
          ${type || null},
          ${description || null},
          ${project_uuid}
        )
        RETURNING project_uuid as uuid, name, type, description, "order"`;

      const column = result[0];
      void pubsub.publish("column/created", column);
      return column
    },

    async update(_, { uuid, name, type, description }) {
      const result = await SQL`
        UPDATE core.columns
        SET 
            name = COALESCE(${name}, name),
            type = COALESCE(${type}, type),
            description = COALESCE(${description}, description)
        WHERE column_uuid = ${uuid}
        RETURNING column_uuid AS uuid, name, "order", type, description, project_uuid`;

      const column = result[0]
      void pubsub.publish("column/updated", column);
      return column;
    },

    async swap(_, { uuid, other_uuid }) {
      await SQL`
        UPDATE core.columns
        SET "order" = (
          SELECT SUM("order")
          FROM core.columns
          WHERE column_uuid IN (${uuid}, ${other_uuid})
        ) - "order"
        WHERE column_uuid IN (${uuid}, ${other_uuid})`;

      // TODO What should subscription return? Array of two coulmns?
      void pubsub.publish("column/updated", {});
    },

    // TODO
    async assign_card(_, { column_uuid, card_uuid }) {
      void pubsub.publish("column/updated", {column_uuid, card_uuid});
    },
  },
};

const subscription = {
  column_created: {
    subscribe: () => pubsub.asyncIterator(['column/created'])
  },
  column_updated: {
    subscribe: () => pubsub.asyncIterator(['column/updated'])
  },
}

export {resolver, mutation, subscription}