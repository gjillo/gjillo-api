import { SQL } from "../../database/Connection";

const resolver = {
  Query: {
    projects() {
      return SQL`
        SELECT project_uuid as uuid, name, creation_timestamp as created
        FROM core.projects
        ORDER BY name`;
    }
  }
}

const mutation = {
  ProjectsMutation: {
    async create(_, { name }) {
      const result = await SQL`
          INSERT INTO core.projects(name)
          VALUES (${name})
          RETURNING project_uuid AS uuid, name, creation_timestamp as "created"`;

      return result[0];
    },

    async update(_, { uuid, name }) {
      const result = await SQL`
          UPDATE core.projects
          SET name = COALESCE(${name}, name)
          WHERE project_uuid = ${uuid}
          RETURNING project_uuid AS uuid, name, creation_timestamp as "created"`;

      return result[0];
    },
  },
};

export { resolver, mutation };