import { SQL } from '../../database/Connection';

const resolver = {
  Query: {
    async project(_, { projectId }) {
      const result = await SQL`
          SELECT project_id as id, name, creation_timestamp as created
          FROM core.projects
          WHERE project_id = ${projectId}`;

      return result[0];
    },
  },
  Project: {
    columns(parent) {
      return SQL`
        SELECT column_id as id, name, project_id, "order", type, description
        FROM core.columns
        WHERE project_id = ${parent.id}
        ORDER BY "order"`;
    },
  },
};

export { resolver };