import { SQL } from '../../database/Connection';

const resolver = {
    Query: {
        async user(_, { userUuid }) {
            const result = await SQL`
                SELECT id as uuid, name, email, image FROM auth.users
                WHERE id=${userUuid}`;

            return result[0];
        },
    },
};

const mutation = {
    UsersMutation: {
        async update(_, { uuid, name, email, image }) {
            const result = await SQL`
                UPDATE core.users
                SET 
                    name = ${name === undefined ? SQL`name` : name},
                    email = ${email === undefined ? SQL`email` : email},
                    image = ${image === undefined ? SQL`image` : image}
                WHERE id = ${uuid}
                RETURNING id AS uuid, name, email, image`;

            return result[0];
        },
    },
};

export { resolver, mutation };