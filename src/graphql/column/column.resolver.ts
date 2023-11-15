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
    async create(_, { name }) {
      void pubsub.publish("column/created", {name});
    },

    async update(_, { uuid, name }) {
      void pubsub.publish("column/updated", {uuid, name});
    },

    async add_card(_, { uuid }) {
      void pubsub.publish("column/updated", {uuid, name});
    },

    async remove_card(_, { uuid }) {
      void pubsub.publish("column/updated", {uuid, name});
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