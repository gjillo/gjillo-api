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
    users(parent) {
      return SQL`
        SELECT id as uuid, users.name, email, image, permissions
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
    tags(parent) {
      return SQL`
        SELECT select_option_uuid as uuid, value, color FROM core.select_options
          JOIN core.fields USING (field_uuid)
        WHERE project_uuid=${parent.uuid}
          AND role = 'tags'`;
    },
  },
};

export { resolver };