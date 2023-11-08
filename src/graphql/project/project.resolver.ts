import { SQL } from '../../database/Connection';

const resolver = {
  Query: {
    async project(_, { projectUuid }) {
      const result = await SQL`
          SELECT project_uuid as uuid, name, creation_timestamp as created
          FROM core.projects
          WHERE project_uuid = ${projectUuid}`;

      return result[0];
    },
  },
  Project: {
    columns(parent) {
      return SQL`
        SELECT column_uuid as uuid, name, project_uuid, "order", type, description
        FROM core.columns
        WHERE project_uuid = ${parent.uuid}
        ORDER BY "order"`;
    },
  },
};

export { resolver };