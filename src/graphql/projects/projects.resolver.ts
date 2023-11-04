import { SQL } from "@database/Connection";

const mutation = {
  ProjectsMutation: {
    async create(_, { name }) {
      const result = await SQL`
          INSERT INTO core.projects(name)
          VALUES (${name})
          RETURNING project_id AS "id", name, creation_timestamp as "created"`;

      return result[0];
    },

    async update(_, { id, name }) {
      const result = await SQL`
          UPDATE core.projects
          SET name = COALESCE(${name}, name)
          WHERE project_id = ${id}
          RETURNING project_id AS "id", name, creation_timestamp as "created"`;

      return result[0];
    },
  },
};

export { mutation };