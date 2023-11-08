import { SQL } from '../../../database/Connection';

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

export { resolver };