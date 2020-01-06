import { getContent } from '../preview/fs';
import { loadPage } from './page';

const appStore: any = {};
let appJson: any = {};

function App(app) {
  appStore.app = app;
}

function injectApp(host: any) {
  host.App = App;
}

function getAppStore() {
  return appStore;
}

function loadAppJson() {
  appJson = JSON.parse(getContent('/app.json'));
}

function initApp() {
  loadAppJson();
  for (const pagePath of appJson.pages) {
    loadPage('/' + pagePath);
  }
}

function getFirstPage() {
  const firstPage = appJson.pages[0];
  return '/' + firstPage;
}

export { injectApp, getAppStore, initApp, getFirstPage };
