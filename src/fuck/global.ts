import { getCurrentPages, getCurrentPageInstance } from "./router";
import { getWx } from "./wx";
import { getApp } from "./app";

function getGlobalVar() {
  return {
    wx: getWx(),
    getCurrentPages,
    getApp,
    requirePlugin: function() {},
    // Component: function(component) {
    //   debugger
    //   console.log('Component', component);
    // },
    get __wxRoute() {
      return 'pages/index/index';
      return getCurrentPageInstance().path;
    },
  };
}

export { getGlobalVar };
