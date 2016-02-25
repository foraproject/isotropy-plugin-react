/* @flow */
import reactAdapter from "isotropy-adapter-react";
import Router from "isotropy-router";

import type { HttpMethodRouteOptionsType, HttpMethodRouteArgsType } from "isotropy-router";
import type { IncomingMessage, ServerResponse } from "./flow/http";


type HandlerRouteType = {
  type: "handler",
  url: string,
  method: string,
  handler: (...args: Array<any>) => Promise;
}

type ReactComponentRouteType = {
  type: "react",
  url: string,
  method: string,
  component: Function,
  args: Object,
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
  options: HttpMethodRouteOptionsType
}

type AppRouteType = ReactComponentRouteType | HandlerRouteType | RelayRouteType;

export type ReactPluginConfigType = {
  routes: Array<AppRouteType>,
  type: string,
  path: string,
  renderToStaticMarkup?: boolean,
  toHtml: (html: string, props?: Object) => string,
  elementSelector: string
};

export type ReactConfigType = {
};

export type getDefaultsParamsType = {
  routes: Array<AppRouteType>,
  toHtml?: (html: string, props?: Object) => string
}

const getDefaults = function(val: getDefaultsParamsType = { routes: [] }) : ReactPluginConfigType {
  return  {
    type: val.type || "react",
    routes: val.routes,
    path: val.path || "/",
    renderToStaticMarkup: (typeof(val.renderToStaticMarkup) !== "undefined" && val.renderToStaticMarkup !== null) ? val.renderToStaticMarkup : false,
    toHtml: val.toHtml || ((html) => html),
    elementSelector: val.elementSelector || "#isotropy-container"
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
    handler: async (req: IncomingMessage, res: ServerResponse, args: Object) => {
      reactAdapter.render({
          component: route.component,
          req,
          res,
          args,
          options: {
            renderToStaticMarkup: appConfig.renderToStaticMarkup,
            toHtml: appConfig.toHtml,
            elementSelector: appConfig.elementSelector
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
    handler: async (req: IncomingMessage, res: ServerResponse, args: Object) => {
      await reactAdapter.renderRelayContainer({
          relayContainer: route.relayContainer,
          relayRoute: route.relayRoute,
          graphqlUrl: route.graphqlUrl,
          req,
          res,
          args,
          options: {
            renderToStaticMarkup: appConfig.renderToStaticMarkup,
            toHtml: appConfig.toHtml,
            elementSelector: appConfig.elementSelector
          }
        }
      );
    },
    options: { argumentsAsObject: true }
  };
}

const setup = async function(appConfig: ReactPluginConfigType, router: Router, config: ReactConfigType) : Promise {
  const routes = appConfig.routes.map(_route => {
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
};


export default {
  getDefaults,
  setup
};
