import { ApolloServerPlugin, /* GraphQLRequestContext, */ GraphQLRequestListener } from "apollo-server-plugin-base"

export const ApolloLogger: ApolloServerPlugin = {
  async requestDidStart(/* requestContext: GraphQLRequestContext<unknown> */): Promise<GraphQLRequestListener<unknown>> {
    console.log('[GraphQL] Incoming request');

    return {
      async didResolveOperation(ctx) {
        console.log('[GraphQL] Operation:', ctx.operationName);
        console.log('[GraphQL] Query:',     ctx.request.query);
        console.log('[GraphQL] Variables:', ctx.request.variables);
      },
      async willSendResponse(ctx) {
        console.log('[GraphQL] Sending response', ctx.response);
      },
      async didEncounterErrors(ctx) {
        console.log("[GraphQL] Encountered errors:", ctx.errors);
      }
    };
  },
};