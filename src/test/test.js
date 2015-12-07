import __polyfill from "babel-polyfill";
import should from 'should';
import http from "http";
import koa from "koa";
import querystring from "querystring";
import reactModule from "../isotropy-plugin-react";
import myComponent from "./my-component";

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
    });


    it(`Should get default configuration values`, () => {
        const config = {};
        const completedConfig = reactModule.getDefaultValues(config);
        completedConfig.type.should.equal("ui_react");
        completedConfig.path.should.equal("/");
    });


    it(`Should serve a react app`, () => {
        const moduleConfig = {
            routes: [
                { url: "/hello", method: "GET", component: myComponent }
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
                { url: "/hello", method: "GET", component: myComponent }
            ]
        }
        const appConfig = { module: moduleConfig, path: "/", renderToStaticMarkup: true };
        const isotropyConfig = { dir: __dirname };

        const promise = new Promise((resolve, reject) => {
            reactModule.setup(appConfig, defaultInstance, isotropyConfig).then(() => {
                makeRequest("localhost", 8080, "/hello", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' }, {}, resolve, reject);
            }, reject);
        });

        return promise.then((data) => {
            data.should.equal("<html><body>Hello World</body></html>");
        });
    });
});
