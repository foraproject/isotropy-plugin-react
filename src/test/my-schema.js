import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLInt
} from 'graphql';

import {
    connectionArgs,
    connectionDefinitions,
    connectionFromArray,
    fromGlobalId,
    globalIdField,
    mutationWithClientMutationId,
    nodeDefinitions,
} from 'graphql-relay';


var {nodeInterface, nodeField} = nodeDefinitions(
    (globalId) => {
        var {type, id} = fromGlobalId(globalId);
        if (type === 'Faction') {
            return getFaction(id);
        } else if (type === 'Ship') {
            return getShip(id);
        } else {
            return null;
        }
    },
    (obj) => {
        return obj.ships ? factionType : shipType;
    }
);

var ShipType = new GraphQLObjectType({
    name: 'Ship',
    description: 'A ship in the Star Wars saga',
    fields: () => ({
        id: globalIdField('Ship'),
        name: {
            type: GraphQLString,
            description: 'The name of the ship.',
        },
    }),
    interfaces: [nodeInterface]
});

const QueryRootType = new GraphQLObjectType({
    name: 'QueryRoot',
    fields: {
        id: globalIdField('Faction'),
        ship: {
            type: ShipType,
            args: {
                id: {
                    type: GraphQLString
                }
            },
            resolve: (root, { id }) => { return { id: id, name: `ENTERPRISE(${id})` }; }
        },
        thrower: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: () => { throw new Error('Throws!'); }
        }
    }
});


const MutationRootType = new GraphQLObjectType({
    name: 'MutationRoot',
    fields: {
        writeTest: {
            type: QueryRootType,
            resolve: () => ({})
        }
    }
});


var TestSchema = new GraphQLSchema({
    query: QueryRootType,
    mutation: MutationRootType
});


export default TestSchema;
