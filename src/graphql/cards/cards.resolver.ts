import { pubsub } from "../context";

const resolver = {
  CardsQuery: {
    card() {
      return {name: "abc"}
    }
  }
}

const mutation = {
  CardsMutation: {
    add_card(_, { name }) {
      console.log(name);
      void pubsub.publish("cards/card_added", {card_added: {name}});
      return { name }
    }
  }
}

const subscription = {
  card_added: {
    subscribe: () => pubsub.asyncIterator(['cards/card_added'])
  }
}

export {resolver, mutation, subscription}