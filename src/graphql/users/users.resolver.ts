import { pubsub } from "../context";
import sql from "../../db";

const resolver = {
  UsersQuery: {
    async users() {
      return sql`SELECT * FROM users`
    }
  }
}

const mutation = {
  UsersMutation: {
    async add_user(_, { first_name, last_name, email, username, password }) {
      console.log(first_name, last_name, email, username, password);
      const users = await sql`
        INSERT INTO users(first_name, last_name, email, username, password)
        VALUES (${first_name}, ${last_name}, ${email}, ${username}, ${password})
        RETURNING user_id, first_name, last_name, email, username, register_timestamp`
      const user_added = users[0];
      void pubsub.publish("users/user_added", {user_added});
      return user_added
    }
  }
}

const subscription = {
  user_added: {
    subscribe: () => pubsub.asyncIterator(['users/user_added'])
  }
}

export {resolver, mutation, subscription}