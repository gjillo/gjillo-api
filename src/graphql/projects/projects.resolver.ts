import { SQL } from "../../database/Connection";
import { pubsub } from "../context";

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

      void pubsub.publish("projects/created", {name});

      return result[0];
    },

    async update(_, { uuid, name }) {
      const result = await SQL`
          UPDATE core.projects
          SET name = COALESCE(${name}, name)
          WHERE project_uuid = ${uuid}
          RETURNING project_uuid AS uuid, name, creation_timestamp as "created"`;

      void pubsub.publish("projects/updated", {uuid, name});

      return result[0];
    },

    async add_user(_, { uuid }) {
      // const result = await SQL``;
      //
      void pubsub.publish("projects/updated", {uuid});

      // return result[0];
    },

    async remove_user(_, { uuid }) {
      // const result = await SQL``;
      //
      void pubsub.publish("projects/updated", {uuid});

      // return result[0];
    },
  },
};

const subscription = {
  project_created: {
    subscribe: () => pubsub.asyncIterator(['projects/created'])
  },
  project_updated: {
    subscribe: () => pubsub.asyncIterator(['projects/updated'])
  },
}

export {resolver, mutation, subscription}