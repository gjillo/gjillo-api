import path from 'path';
import express from 'express';
import {WebSocketServer} from 'ws';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {createServer} from 'http';
import {useServer} from 'graphql-ws/lib/use/ws';
import {ApolloServer} from '@apollo/server';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';
import {expressMiddleware} from '@apollo/server/express4';
import {BootstrapResolvers, BootstrapSchema} from './graphql-bootstrap';
import {LogResolvedFieldsPlugin, ServerCleanupPlugin} from "./apollo-plugins";
import * as process from "process";
import sql from "./db"

const PORT = parseInt(process?.env?.PORT || '4000', 10);
// console.log(sql.options)
async function test() {
  return sql`
    select *
    from users
  `;
}

(async () => {
  // Bootstrap schema and resolvers
  const typeDefs = await BootstrapSchema(path.join(__dirname, './graphql'));
  const resolvers = await BootstrapResolvers(path.join(__dirname, './graphql'));
  console.log(process.env.DB_HOST)

  console.log(test())
  // Create the schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Create all the necessary servers
  const app = express();
  const httpServer = createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({ schema }, wsServer);

  const apolloServer = new ApolloServer({
    resolvers,
    typeDefs,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ServerCleanupPlugin(serverCleanup),
      LogResolvedFieldsPlugin()
    ],
  });

  // Start Apollo before starting the main server
  await apolloServer.start();

  app.use('/graphql', express.json(), expressMiddleware(apolloServer));

  // Start the main server
  await new Promise<void>((resolve) => httpServer.listen(PORT, resolve));
  console.log("GraphQL server is running");
})();
