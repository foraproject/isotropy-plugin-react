/* @flow */
import { KoaContextType, KoaHandlerType } from "koa";
import type KoaAppType from "koa";
import { HttpMethodRouteOptionsType } from "isotropy-router";
import Router from "isotropy-router";
import React from "react";
import reactAdapter from "isotropy-adapter-react";

type ReactAppRouteType = {
    url: string,
    method: string,
    component: Function,
    handler?: KoaHandlerType
}

type ModuleType = {
    routes: Array<ReactAppRouteType>
}

type ReactAppType = {
    module: ModuleType,
    type: string,
    path: string,
    renderToStaticMarkup: boolean
};


type ReactConfigType = {}


const getDefaultValues = function(val: Object = {}) : ReactAppType {
    return  {
        type: val.type || "react",
        module: val.module,
        path: val.path || "/",
        renderToStaticMarkup: (typeof(val.renderToStaticMarkup) !== "undefined" && val.renderToStaticMarkup !== null) ? val.renderToStaticMarkup : false
    };
};


const setup = async function(appConfig: ReactAppType, server: KoaAppType, config: ReactConfigType) : Promise {
    const router = new Router();

    const routes = appConfig.module.routes.map(route => {
        return (typeof route.handler !== "undefined" && route.handler !== null) ?
            {
                type: "pattern",
                method: route.method,
                url: route.url,
                handler: route.handler
            } :
            {
                type: "pattern",
                method: route.method,
                url: route.url,
                handler: (context, props) => {
                    const component = React.createElement(route.component, Object.assign({}, props));
                    reactAdapter.render(context, component, { renderToStaticMarkup: appConfig.renderToStaticMarkup, template: x => x });
                },
                options: { argumentsAsObject: true }
            };
    });

    router.add(routes);

    server.use(async (ctx, next) => {
        await router.doRouting(ctx, next)
    });
};


export default {
    getDefaultValues,
    setup
};
