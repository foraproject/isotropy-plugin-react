import __polyfill from "babel-polyfill";
import should from 'should';
import http from "http";
import Router from "isotropy-router";
import querystring from "querystring";
import promisify from "nodefunc-promisify";
import reactModule from "../isotropy-plugin-react";
import MyComponent from "./my-component";

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
  });

  beforeEach(() => {
    router = new Router();
  });


  it(`Name should be react`, () => {
    reactModule.name.should.equal("react");
  });


  it(`Should get default configuration values`, () => {
    const config = { type: "react" };
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
    data.result.should.startWith("<html data-reactroot");
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

});
