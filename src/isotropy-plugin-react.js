/* @flow */

import type { KoaType, KoaContextType, KoaHandlerType } from "./flow/koa-types";
import type { HttpMethodRouteOptionsType, HttpMethodRouteArgsType } from "isotropy-router";
import Router from "isotropy-router";
import reactAdapter from "isotropy-adapter-react";


type HandlerRouteType = {
    type: "handler",
    url: string,
    method: string,
    handler: KoaHandlerType
}

type ReactComponentRouteType = {
    type: "react",
    url: string,
    method: string,
    component: Function,
    args: Object,
    context: KoaContextType,
    options: HttpMethodRouteOptionsType
}

type RelayRouteType = {
    type: "relay",
    url: string,
    method: string,
    relayContainer: Function,
    relayRoute: Object,
    graphqlUrl: string,
    args: Object,
    context: KoaContextType,
    options: HttpMethodRouteOptionsType
}

type AppRouteType = ReactComponentRouteType | HandlerRouteType | RelayRouteType;

type ModuleType = {
    routes: Array<AppRouteType>
}

export type ReactPluginConfigType = {
    module: ModuleType,
    type: string,
    path: string,
    renderToStaticMarkup?: boolean,
    toHtml: (html: string, props?: Object) => string,
    elementSelector: string
};

export type ReactConfigType = {}

const getDefaults = function(val: Object = {}) : ReactPluginConfigType {
    return  {
        type: val.type || "react",
        module: val.module,
        path: val.path || "/",
        renderToStaticMarkup: (typeof(val.renderToStaticMarkup) !== "undefined" && val.renderToStaticMarkup !== null) ? val.renderToStaticMarkup : false,
        toHtml: val.toHtml,
        elementSelector: val.elementSelector
    };
};

const getAppRoute = function(route: Object) : AppRouteType {
    if (typeof route.handler !== "undefined" && route.handler !== null) {
        return Object.assign({}, route, { type: "handler" });
    } else if (typeof route.component !== "undefined" && route.component !== null) {
        return Object.assign({}, route, { type: "react" });
    } else if (typeof route.relayContainer !== "undefined" && route.relayContainer !== null) {
        return Object.assign({}, route, { type: "relay" });
    } else {
        throw new Error("Unknown type. Route type must be handler, react or relay.");
    }
};

const getHandlerRoute = function(route: HandlerRouteType, appConfig: ReactPluginConfigType) : HttpMethodRouteArgsType {
    return {
        type: "pattern",
        method: route.method,
        url: route.url,
        handler: route.handler
    };
};

const getReactRoute = function(route: ReactComponentRouteType, appConfig: ReactPluginConfigType) : HttpMethodRouteArgsType {
    return {
        type: "pattern",
        method: route.method,
        url: route.url,
        handler: async (context: KoaContextType, args: Object) => {
            reactAdapter.render(
                {
                    component: route.component,
                    args,
                    context,
                    options: {
                        renderToStaticMarkup: appConfig.renderToStaticMarkup,
                        toHtml: appConfig.toHtml,
                        elementSelector: "#isotropy-container"
                    }
                }
            );
        },
        options: { argumentsAsObject: true }
    };
};

const getRelayRoute = function(route: RelayRouteType, appConfig: ReactPluginConfigType) : HttpMethodRouteArgsType {
    return {
        type: "pattern",
        method: route.method,
        url: route.url,
        handler: async (context: KoaContextType, args: Object) => {
            await reactAdapter.renderRelayContainer(
                {
                    relayContainer: route.relayContainer,
                    relayRoute: route.relayRoute,
                    graphqlUrl: route.graphqlUrl,
                    args,
                    context,
                    options: {
                        renderToStaticMarkup: appConfig.renderToStaticMarkup,
                        toHtml: appConfig.toHtml,
                        elementSelector: "#isotropy-container"
                    }
                }
            );
        },
        options: { argumentsAsObject: true }
    };
}

const setup = async function(appConfig: ReactPluginConfigType, server: KoaType, config: ReactConfigType) : Promise {
    const router = new Router();

    const routes = appConfig.module.routes.map(_route => {
        const route = getAppRoute(_route);
        if (route.type === "handler") {
            return getHandlerRoute(route, appConfig);
        } else if (route.type === "react") {
            return getReactRoute(route, appConfig);
        } else if (route.type === "relay") {
            return getRelayRoute(route, appConfig);
        } else {
            throw new Error("Unknown type. Route type must be handler, react or relay.");
        }
    });
    router.add(routes);

    server.use(async (ctx, next) => {
        await router.doRouting(ctx, next)
    });
};


export default {
    getDefaults,
    setup
};
