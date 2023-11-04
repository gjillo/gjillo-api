import { SQL } from '../../../database/Connection';

const resolver = {
  Column: {
    cards(parent) {
      const result = SQL`
          SELECT card_id as id, name, description, story_points, creation_timestamp as created, "order"
          FROM core.cards
          WHERE column_id = ${parent.id}
          ORDER BY "order"`;

      return result;
    },
  },
};

export { resolver };