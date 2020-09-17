import { requirePage } from '../preview/fs';
import { isFunction } from '../function';
import { getWx } from './wx';

const pageStore: { [path: string]: any } = {};

function setData(nextData) {
  this.data = {
    ...this.data,
    ...nextData,
  };
  console.log('data is ', this.data);
  if (this.__updater) {
    this.__updater();
  }
}

function loadPage(path: string) {
  if (!pageStore[path]) {
    function pageConstructor(page) {
      console.log('pageConstructor', page);
      pageStore[path] = page;
    }
    requirePage(path + '.js', { Page: pageConstructor, Component: pageConstructor, wx: getWx() });
  }
}

function createPageInstance(path: string) {
  const page = { data: {}, ...pageStore[path] };
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
  onReady(page: any) {
    if (isFunction(page.onReady)) {
      page.onReady();
    }
  },
};

export { createPageInstance, loadPage, LifeTime };
