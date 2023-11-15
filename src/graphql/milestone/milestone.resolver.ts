import { SQL } from '../../database/Connection';

// const resolver = {
//     Query: {
//         async milestone(_, { milestoneUuid }) {
//             const result = await SQL`
//                 SELECT milestone_uuid as uuid, name, creation_timestamp, deadline FROM core.milestones
//                 WHERE milestone_uuid=${milestoneUuid}`;
//
//             return result[0];
//         },
//
//         async milestones(_, { projectUuid }) {
//             const result = await SQL`
//                 SELECT milestone_uuid as uuid, name, creation_timestamp, deadline FROM core.milestones
//                 WHERE project_uuid=${projectUuid}`;
//
//             return result[0];
//         },
//     },
// };

const mutation = {
    MilestoneMutation: {
        async create(_, { name, deadline, project_uuid }) {
            const result = await SQL`
                INSERT INTO core.milestones(name, deadline, project_uuid)
                VALUES (${name}, ${deadline}, ${project_uuid})
                RETURNING milestone_uuid AS uuid, name, deadline, creation_timestamp, project_uuid`;

            return result[0];
        },

        async update(_, { uuid, name, deadline, project_uuid }) {
            const result = await SQL`
                UPDATE core.milestones
                SET 
                    name = COALESCE(${name}, name),
                    deadline = COALESCE(${deadline}, deadline),
                    project_uuid = COALESCE(${project_uuid}, project_uuid),
                WHERE milestone_uuid = ${uuid}
                RETURNING milestone_uuid AS uuid, name, deadline, creation_timestamp, project_uuid`;

            return result[0];
        },

        // TODO returning?
        async assign_card(_, { milestone_uuid, card_uuid }) {
            const result = await SQL`
                UPDATE core.cards
                SET milestone_uuid = ${milestone_uuid},
                WHERE card_uuid = ${card_uuid}
//                 RETURNING milestone_uuid AS uuid, name, deadline, creation_timestamp, project_uuid
                `;

            return result[0];
        },

        // TODO returning?
        async unassign_card(_, { card_uuid }) {
            const result = await SQL`
                UPDATE core.cards
                SET milestone_uuid = null,
                WHERE card_uuid = ${card_uuid}
//                 RETURNING milestone_uuid AS uuid, name, deadline, creation_timestamp, project_uuid
                `;

            return result[0];
        },
    },
};

export { mutation };