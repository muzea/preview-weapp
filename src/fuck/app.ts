const appStore: any = {};

function App(app) {
  appStore.app = app;
}

function injectApp(host: any) {
  host.App = App;
}

function getAppStore() {
  return appStore;
}

export {
  injectApp,
  getAppStore
}
