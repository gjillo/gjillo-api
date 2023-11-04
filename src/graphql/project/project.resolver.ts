import { SQL } from "../../database/Connection";

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
};

export { resolver };