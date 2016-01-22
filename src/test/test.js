import __polyfill from "babel-polyfill";
import should from 'should';
import http from "http";
import koa from "koa";
import querystring from "querystring";
import reactModule from "../isotropy-plugin-react";
import schema from "./my-schema";
import MyComponent from "./my-component";
import MyRelayComponent from "./my-relay-component";
import MyRelayRoute from "./my-relay-route";

//For now the GraphQL server is going to run as a separate process.
import express from 'express';
import graphQLHTTP from 'express-graphql';

describe("Isotropy React Plugin", () => {

  let defaultInstance: KoaAppType;

  const makeRequest = (host, port, path, method, headers, _postData, cb, onErrorCb) => {
    const postData = (typeof _postData === "string") ? _postData : querystring.stringify(_postData);
    const options = { host, port, path, method, headers };

    let result = "";
    const req = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function(data) { result += data; });
      res.on('end', function() { cb(result); });
    });
    req.on('error', function(e) { onErrorCb(e); });
    req.write(postData);
    req.end();
  };


  before(function() {
    defaultInstance = new koa();
    defaultInstance.listen(8080);

    const app = express();
    // Expose a GraphQL endpoint
    app.use('/graphql', graphQLHTTP({schema, pretty: true}));
    app.listen(8081);
  });


  it(`Should get default configuration values`, () => {
    const config = {};
    const completedConfig = reactModule.getDefaults(config);
    completedConfig.type.should.equal("react");
    completedConfig.path.should.equal("/");
  });


  it(`Should serve a react app`, () => {
    const moduleConfig = {
      routes: [
        { url: "/hello", method: "GET", component: MyComponent }
      ]
    }
    const appConfig = { module: moduleConfig, path: "/", renderToStaticMarkup: false };
    const isotropyConfig = { dir: __dirname };

    const promise = new Promise((resolve, reject) => {
      reactModule.setup(appConfig, defaultInstance, isotropyConfig).then(() => {
        makeRequest("localhost", 8080, "/hello", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' }, {}, resolve, reject);
      }, reject);
    });

    return promise.then((data) => {
      data.should.startWith("<html data-reactid");
    });
  });


  it(`Should serve a react app with static markup`, () => {
    const moduleConfig = {
      routes: [
        { url: "/hello/:name", method: "GET", component: MyComponent }
      ]
    }
    const appConfig = { module: moduleConfig, path: "/", renderToStaticMarkup: true };
    const isotropyConfig = { dir: __dirname };

    const promise = new Promise((resolve, reject) => {
      reactModule.setup(appConfig, defaultInstance, isotropyConfig).then(() => {
        makeRequest("localhost", 8080, "/hello/mister", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' }, {}, resolve, reject);
      }, reject);
    });

    return promise.then((data) => {
      data.should.equal("<html><body>Hello mister</body></html>");
    });
  });


  it(`Should serve a relay+react app with static markup`, () => {
    const moduleConfig = {
      routes: [
        { url: "/hellorelay/:id", method: "GET", relayContainer: MyRelayComponent, relayRoute: MyRelayRoute, graphqlUrl: "http://localhost:8081/graphql" }
      ]
    }
    const appConfig = { module: moduleConfig, path: "/", renderToStaticMarkup: true };
    const isotropyConfig = { dir: __dirname };

    const promise = new Promise((resolve, reject) => {
      reactModule.setup(appConfig, defaultInstance, isotropyConfig).then(() => {
        makeRequest("localhost", 8080, "/hellorelay/265", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' }, {}, resolve, reject);
      }, reject);
    });

    return promise.then((data) => {
      data.should.equal("<html><body>Hello ENTERPRISE(265)</body></html>");
    });
  });
});
