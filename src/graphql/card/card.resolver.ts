import { SQL } from '../../database/Connection';
import { pubsub } from "../context";

const resolver = {
  Card: {
    assignees(parent) {
      return SQL`
          SELECT auth.users.id as uuid, auth.users.name as name, email, image
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

      return result[0]['value'];
    },
    tags(parent) {
      return SQL`
          SELECT value, color
          FROM core.cards
              JOIN core.select_values USING (card_uuid)
              JOIN core.select_options USING (select_option_uuid)
              JOIN core.fields ON core.fields.field_uuid = select_values.field_uuid
          WHERE card_uuid = ${parent.uuid}
            AND role = 'tags'`;
    },
  },
};

const mutation = {
  CardsMutation: {
    // TODO change mutation parameters
    async create(_, { uuid, name, email, image }) {
      void pubsub.publish("card/created", {});
      // const result = await SQL``;
      //
      // return result[0];
    },
    async update_details(_, { uuid, name, email, image }) {
      void pubsub.publish("card/updated", {});
      // const result = await SQL``;
      //
      // return result[0];
    },
    async update_text_field(_, { uuid, name, email, image }) {
      void pubsub.publish("card/updated", {});
      // const result = await SQL``;
      //
      // return result[0];
    },
    async update_number_field(_, { uuid, name, email, image }) {
      void pubsub.publish("card/updated", {});
      // const result = await SQL``;
      //
      // return result[0];
    },
    async update_checkbox_field(_, { uuid, name, email, image }) {
      void pubsub.publish("card/updated", {});
      // const result = await SQL``;
      //
      // return result[0];
    },
    async update_date_field(_, { uuid, name, email, image }) {
      void pubsub.publish("card/updated", {uuid});
      // const result = await SQL``;
      //
      // return result[0];
    },
    async update_select_field(_, { uuid, name, email, image }) {
      void pubsub.publish("card/updated", {uuid});
      // const result = await SQL``;
      //
      // return result[0];
    },
  },
};

const subscription = {
  card_created: {
    subscribe: () => pubsub.asyncIterator(['card/created'])
  },
  card_updated: {
    subscribe: () => pubsub.asyncIterator(['card/updated'])
  },
}

export {resolver, mutation, subscription}