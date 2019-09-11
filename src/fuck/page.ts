const pageStore: any = {};

function setData(nextData) {
  this.data = {
    ...this.data,
    ...nextData,
  };
  if (this.__updater) {
    this.__updater();
  }
}

function Page(page: Object) {
  Object.defineProperty(page, 'setData', {
    value: setData.bind(page),
  });
  pageStore[pageStore.nextPath] = page;
}

function injectPage(host: any) {
  host.Page = Page;
}

function loadPage(path: string, code: string) {
  pageStore.nextPath = path;
  const func = new Function(code);
  func();
  pageStore.nextPath = '';
}

function getPageStore() {
  return pageStore;
}

export {
  getPageStore,
  injectPage,
  loadPage,
}
