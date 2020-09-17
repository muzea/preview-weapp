import { getContent, requirePage } from '../preview/fs';
import { loadPage } from './page';
import { isFunction } from 'util';
import { getWx } from './wx';

const appHost: any = {
  app: {},
};
let appJson: any = {};

function App(app) {
  appHost.app = app;
}

function injectApp(host: any) {
  host.App = App;
}

function getApp() {
  return appHost.app;
}

function loadAppJson() {
  appJson = JSON.parse(getContent('/app.json'));
}

function initApp() {
  loadAppJson();
  loadApp();
  AppLifeTime.onLaunch();
  for (const pagePath of appJson.pages) {
    loadPage('/' + pagePath);
  }
}

function getFirstPage() {
  const firstPage = appJson.pages[0];
  return '/' + firstPage;
}

const AppPath = '/app.js';

function loadApp() {
  requirePage(AppPath, { App, wx: getWx() });
}

const AppLifeTime = {
  onLaunch() {
    if (isFunction(appHost.app.onLoad)) {
      appHost.app.onLaunch();
    }
  },
  onShow() {
    if (isFunction(appHost.app.onShow)) {
      appHost.app.onShow();
    }
  },
};

export { injectApp, getApp, initApp, getFirstPage, loadApp, AppLifeTime };
