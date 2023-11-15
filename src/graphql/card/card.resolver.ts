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
  },
};


// TODO
// update_select_field select could require separate function
const update_field = async (_, { card_uuid, field_uuid, value }) => {
  void pubsub.publish("card/updated", {});
}

const mutation = {
  CardsMutation: {
    // TODO
    async create(_, { name, description, story_points, assignee_uuids, deadline, tag_uuids }) {
      void pubsub.publish("card/created", { name, description, story_points, assignee_uuids, deadline, tag_uuids });
      // const result = await SQL``;
      //
      // return result[0];
    },
    // TODO
    async update_details(_, { uuid, name, description, story_points, order, asignee_uuids, deadline, tag_uuids }) {
      void pubsub.publish("card/updated", { uuid, name, description, story_points, order, asignee_uuids, deadline, tag_uuids });
      // const result = await SQL``;
      //
      // return result[0];
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
    subscribe: () => pubsub.asyncIterator(['card/created'])
  },
  card_updated: {
    subscribe: () => pubsub.asyncIterator(['card/updated'])
  },
}

export {resolver, mutation, subscription}