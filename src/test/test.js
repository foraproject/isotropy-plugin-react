import __polyfill from "babel-polyfill";
import should from 'should';
import http from "http";
import Router from "isotropy-router";
import querystring from "querystring";
import promisify from "nodefunc-promisify";
import reactModule from "../isotropy-plugin-react";
import schema from "./my-schema";
import MyComponent from "./my-component";
import MyRelayComponent from "./my-relay-component";
import MyRelayRoute from "./my-relay-route";

//For now the GraphQL server is going to run as a separate process.
import express from 'express';
import graphQLHTTP from 'express-graphql';

describe("Isotropy React Plugin", () => {

  const makeRequest = (host, port, path, method, headers, _postData) => {
    return new Promise((resolve, reject) => {
      const postData = (typeof _postData === "string") ? _postData : querystring.stringify(_postData);
      const options = { host, port, path, method, headers };

      let result = "";
      const req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(data) { result += data; });
        res.on('end', function() { resolve({ result, res }); });
      });
      req.on('error', function(e) { reject(e); });
      req.write(postData);
      req.end();
    });
  };

  let server, router;

  before(async () => {
    server = http.createServer((req, res) => router.doRouting(req, res));
    const listen = promisify(server.listen.bind(server));
    await listen(0);

    // Expose a GraphQL endpoint
    await listen(0)
    const app = express();
    const expressListen = promisify(app.listen.bind(app));
    app.use('/graphql', graphQLHTTP({schema, pretty: true}));
    await expressListen(8081);
  });

  beforeEach(() => {
    router = new Router();
  });


  it(`Should get default configuration values`, () => {
    const config = {};
    const completedConfig = reactModule.getDefaults(config);
    completedConfig.type.should.equal("react");
    completedConfig.path.should.equal("/");
  });


  it(`Should serve a react app`, async () => {
    const routes = [
      { url: "/hello", method: "GET", component: MyComponent }
    ];
    const appConfig = { routes, path: "/", renderToStaticMarkup: false };
    const isotropyConfig = { dir: __dirname };

    await reactModule.setup(appConfig, router, isotropyConfig);
    const data = await makeRequest("localhost", server.address().port, "/hello", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' }, {});
    data.result.should.startWith("<html data-reactid");
  });


  it(`Should serve a react app with static markup`, async () => {
    const routes = [
      { url: "/hello/:name", method: "GET", component: MyComponent }
    ];
    const appConfig = { routes, path: "/", renderToStaticMarkup: true };
    const isotropyConfig = { dir: __dirname };

    await reactModule.setup(appConfig, router, isotropyConfig);
    const data = await makeRequest("localhost", server.address().port, "/hello/mister", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' }, {});
    data.result.should.equal("<html><body>Hello mister</body></html>");
  });


  it(`Should serve a relay+react app with static markup`, async () => {
    const routes = [
      { url: "/hellorelay/:id", method: "GET", relayContainer: MyRelayComponent, relayRoute: MyRelayRoute, graphqlUrl: "http://localhost:8081/graphql" }
    ];
    const appConfig = { routes, path: "/", renderToStaticMarkup: true };
    const isotropyConfig = { dir: __dirname };

    await reactModule.setup(appConfig, router, isotropyConfig);
    const data = await makeRequest("localhost", server.address().port, "/hellorelay/265", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' }, {});
    data.result.should.equal("<html><body>Hello ENTERPRISE(265)</body></html>");
  });
});
