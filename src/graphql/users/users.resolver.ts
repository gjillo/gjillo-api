import { pubsub } from "../context";

const resolver = {
  UsersQuery: {
    user() {



      return {
        first_name: "abc",
        last_name: "abc",
        email: "abc",
        username: "abc",
      }
    }
  }
}

const mutation = {
  UsersMutation: {
    add_user(_, { first_name, last_name, email, username }) {
      console.log(first_name, last_name, email, username);
      void pubsub.publish("users/user_added", {user_added: {first_name, last_name, email, username}});
      return { first_name, last_name, email, username }
    }
  }
}

const subscription = {
  user_added: {
    subscribe: () => pubsub.asyncIterator(['users/user_added'])
  }
}

export {resolver, mutation, subscription}