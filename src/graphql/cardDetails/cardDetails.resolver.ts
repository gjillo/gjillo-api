import { SQL } from '../../database/Connection';

const resolver = {
  Query: {
    async card_details(parent, { cardUuid }) {
      const result = await SQL`
      SELECT card_uuid as uuid, name, description, story_points, creation_timestamp as created, "order"
      FROM core.cards
      WHERE card_uuid = ${cardUuid}`;

      return result[0];
    },
  },
  CardDetails: {
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
          SELECT select_option_uuid as uuid, value, color
          FROM core.cards
              JOIN core.select_values USING (card_uuid)
              JOIN core.select_options USING (select_option_uuid)
              JOIN core.fields ON core.fields.field_uuid = select_values.field_uuid
          WHERE card_uuid = ${parent.uuid}
            AND role = 'tags'`;
    },
    async fields(parent) {
      const result = await SQL`
      SELECT field_uuid, field_type, date_value, checkbox_value, number_value, select_value, text_value
      FROM core.get_card_fields_values(${parent.uuid})`;

      return result.map(v => ({
        ...v,
        data: v,
      }));
    },
    async milestone(parent) {
      const result = await SQL`
          SELECT milestone_uuid as uuid, milestones.name, milestones.creation_timestamp, deadline
          FROM core.milestones
              JOIN core.cards USING (milestone_uuid)
          WHERE card_uuid = ${parent.uuid}`;

      return result[0]
    },
  },
};



export { resolver };