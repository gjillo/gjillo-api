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

      void pubsub.publish("project_created", {name});

      return result[0];
    },

    async update(_, { uuid, name }) {
      const result = await SQL`
          UPDATE core.projects
          SET name = ${name === undefined ? SQL`name` : name}
          WHERE project_uuid = ${uuid}
          RETURNING project_uuid AS uuid, name, creation_timestamp as "created"`;

      void pubsub.publish("project_updated", {uuid, name});

      return result[0];
    },

    // TODO
    async add_user(_, { project_uuid, user_uuid }) {
      // const result = await SQL``;
      //
      void pubsub.publish("project_updated", { project_uuid, user_uuid });

      // return result[0];
    },

    // TODO
    async remove_user(_, { project_uuid, user_uuid }) {
      // const result = await SQL``;
      //
      void pubsub.publish("project_updated", { project_uuid, user_uuid });

      // return result[0];
    },
  },
};

const subscription = {
  project_created: {
    subscribe: () => pubsub.asyncIterator(['project_created'])
  },
  project_updated: {
    subscribe: () => pubsub.asyncIterator(['project_updated'])
  },
}

export {resolver, mutation, subscription}