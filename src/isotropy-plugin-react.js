/* @flow */
import { KoaContextType, KoaHandlerType } from "koa";
import type KoaAppType from "koa";
import { HttpMethodRouteOptionsType, AddRouteArgsType } from "isotropy-router";
import Router from "isotropy-router";
import React from "react";
import reactAdapter from "isotropy-adapter-react";

type HttpMethodRouteArgsType = {
    type: "pattern",
    method: string,
    url: string,
    re: RegExp, handler:
    KoaHandlerType,
    options: HttpMethodRouteOptionsType
}


type ModuleType = {
    routes: Array<HttpMethodRouteArgsType>
}


type ReactAppType = {
    module: ModuleType,
    type: string,
    path: string
};


type IsotropyOptionsType = {
    dir: string,
    port: number,
    koa: KoaAppType
};


const getDefaultValues = function(val: Object = {}) : ReactAppType {
    return  {
        type: val.type || "ui_react",
        module: val.module,
        path: val.path || "/"
    };
};


const setup = async function(appConfig: ReactAppType, server: KoaAppType, isotropyConfig: IsotropyConfigType) : Promise {
    const router = new Router();

    const routes = appConfig.module.routes.map(route => {
        return {
            method: "GET",
            url: route.url,
            handler: (context, props) => {
                var component = React.createElement(route.component, Object.assign({}, props));
                reactAdapter.render(context, component, appConfig);
            },
            options: { argumentsAsObject: true }
        }
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
