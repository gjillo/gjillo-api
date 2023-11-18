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
  void pubsub.publish("card/updated", {});
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
      void pubsub.publish("card/created", card);
      return card;
    },

    // TODO
    async update_details(_, { uuid, name, description, story_points, assignee_uuids, deadline, tag_uuids, milestone_uuid, column_uuid }) {
      const result = await SQL`
        UPDATE core.cards
        SET
          name = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          story_points = COALESCE(${story_points}, story_points),
          column_uuid = COALESCE(${column_uuid}, column_uuid),
          milestone_uuid = COALESCE(${milestone_uuid}, milestone_uuid)
        WHERE card_uuid = ${uuid}
        RETURNING card_uuid as uuid, name, description, story_points, creation_timestamp as created, "order"`;
      const card = result[0];

      if (deadline != null) {
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

      if (assignee_uuids != null) {
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
        await SQL`INSERT INTO core.select_values ${SQL(tagUUIDs)} ON CONFLICT DO NOTHING`
      }

      card.assignees = await resolver.Card.assignees(card)
      card.deadline = await resolver.Card.deadline(card)
      card.tags = await resolver.Card.tags(card)
      card.milestone = await resolver.Card.milestone(card)
      card.column = await resolver.Card.column(card)

      void pubsub.publish("card/updated", card);

      return card
    },

    async swap(_, { uuid, other_uuid }) {
      await SQL`
        UPDATE core.cards
        SET "order" = (
          SELECT SUM("order")
          FROM core.cards
          WHERE card_uuid IN (${uuid}, ${other_uuid})
        ) - "order"
        WHERE card_uuid IN (${uuid}, ${other_uuid})`;

      // TODO What should subscription return? Array of two cards?
      void pubsub.publish("card/updated", {});
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