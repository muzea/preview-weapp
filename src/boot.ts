import { RouterItem } from './type';
import { replaceName } from './preview/style';
import { getHandler } from './preview/event';
import { parser, render, updater } from './preview/wxml';
import { createPageInstance, LifeTime } from './fuck/page';
import { createRootMountPoint, createPage, mountBaseStyle, mountPageStyle } from './preview/dom';
import { debounce } from './function';
import { loadFileViaInput, getContent } from './preview/fs';
import { initApp, getFirstPage } from './fuck/app';

const mountPosition = document.getElementById('weapp') as HTMLDivElement;
const runButton = document.getElementById('run') as HTMLButtonElement;
const loadFileInput = document.getElementById('loadFile') as HTMLInputElement;

loadFileInput.addEventListener('change', loadFileViaInput);

const routers: RouterItem[] = [];

function getCurrentPageInstance() {
  return routers[routers.length - 1].instance;
}

function run(e: Event) {
  e.preventDefault();
  initApp();
  const pagePath = getFirstPage();
  routers.push({
    path: pagePath,
    instance: createPageInstance(pagePath),
  });
  const instance = routers[0].instance;
  LifeTime.onLoad(instance);
  const shadow = createRootMountPoint(mountPosition);
  mountBaseStyle(shadow);

  const wxPage = createPage(shadow);
  mountPageStyle(shadow, replaceName(getContent(pagePath + '.wxss'), wxPage));
  const handler = getHandler(getCurrentPageInstance);
  wxPage.addEventListener('click', handler);
  const builders = parser(getContent(pagePath + '.wxml'));
  let prev = render(builders, instance.data, wxPage);
  LifeTime.onShow(instance);
  instance.__pageElement = wxPage;
  instance.__pageBuilderFunc = builders;
  instance.__pageStateTree = prev;
  instance.__updater = debounce(function() {
    this.__pageStateTree = updater(this.__pageBuilderFunc, this.data, this.__pageElement, this.__pageStateTree);
  });
}
runButton.addEventListener('click', run);
