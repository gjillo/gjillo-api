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
  ProjectDetails: {
    columns(parent) {
      return SQL`
        SELECT column_uuid as uuid, name, project_uuid, "order", type, description
        FROM core.columns
        WHERE project_uuid = ${parent.uuid}
        ORDER BY "order"`;
    },
    // TODO user permissions could be selected there, but User type doesn't have field for this
    users(parent) {
      return SQL`
        SELECT id as uuid, users.name, email, image
        FROM auth.users
            JOIN core.project_users ON users.id = project_users.user_uuid
            JOIN core.projects USING (project_uuid)
        WHERE project_uuid = ${parent.uuid}`;
    },
    milestones(parent) {
      return SQL`
        SELECT milestone_uuid as uuid, name, creation_timestamp, deadline FROM core.milestones
        WHERE project_uuid=${parent.uuid}`;
    },
  },
};

export { resolver };