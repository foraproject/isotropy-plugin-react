import __polyfill from "babel-polyfill";
import path from 'path';
import fs from 'fs';
import Schema from '../../dist/test/my-schema';
import { graphql }  from 'graphql';
import { introspectionQuery, printSchema } from 'graphql/utilities';

// Save JSON of full schema introspection for Babel Relay Plugin to use
(async () => {
    var result = await (graphql(Schema, introspectionQuery));
    if (result.errors) {
        console.error(
            'ERROR introspecting schema: ',
            JSON.stringify(result.errors, null, 2)
        );
    } else {
        fs.writeFileSync(
            path.join(__dirname, '../../dist/test/my-schema.json'),
            JSON.stringify(result, null, 2)
        );
    }
})();

// Save user readable type system shorthand of schema
fs.writeFileSync(
    path.join(__dirname, '../../dist/test/my-schema.graphql'),
    printSchema(Schema)
);
