import { requirePage } from '../preview/fs';
import { isFunction } from '../function';

const pageStore: { [path: string]: any } = {};

function setData(nextData) {
  this.data = {
    ...this.data,
    ...nextData,
  };
  if (this.__updater) {
    this.__updater();
  }
}

function loadPage(path: string) {
  if (!pageStore[path]) {
    function pageConstructor(page) {
      pageStore[path] = page;
    }
    requirePage(path + '.js', { Page: pageConstructor });
  }
}

function createPageInstance(path: string) {
  const page = { ...pageStore[path] };
  Object.defineProperty(page, 'setData', {
    value: setData.bind(page),
  });
  return page;
}

const LifeTime = {
  onLoad(page: any) {
    if (isFunction(page.onLoad)) {
      page.onLoad();
    }
  },
  onShow(page: any) {
    if (isFunction(page.onShow)) {
      page.onShow();
    }
  },
};

export { createPageInstance, loadPage, LifeTime };
