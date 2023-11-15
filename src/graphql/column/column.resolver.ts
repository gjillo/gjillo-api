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
    // TODO
    async create(_, { project_uuid, name, type, description }) {
      void pubsub.publish("column/created", {project_uuid, name, type, description});
    },

    // TODO
    async update(_, { column_uuid, name, order, type, description }) {
      void pubsub.publish("column/updated", {column_uuid, name, order, type, description});
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