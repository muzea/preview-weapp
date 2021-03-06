import { RouterItem } from './type';
import { replaceName } from './preview/style';
import { getHandler } from './preview/event';
import { parser, render, updater } from './preview/wxml';
import { getPageStore, loadPage, injectPage } from './fuck/page';
import { createRootMountPoint, createPage, mountBaseStyle, mountPageStyle } from './preview/dom';
import { debounce } from './function';

const mountPosition = document.getElementById('weapp') as HTMLDivElement;
const runButton = document.getElementById('run') as HTMLButtonElement;
const loadFileInput = document.getElementById('loadFile') as HTMLInputElement;

const fileMap: {
  [x: string]: string
} = {};

function readFile(file: any): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
      // console.log('onload', evt);
      resolve((evt.target as any).result)
    }
    reader.onerror = function () {
        throw new Error('cannot read file');
    }
  });
}

async function loadFile(evt: Event) {
  const files = (evt.target as any).files as any[];
  const end = files.length;
  for(let i = 0; i < end; i++) {
    const file = files[i];
    const path = file.webkitRelativePath as string;
    if (file.name.startsWith('.')) {
      continue;
    }
    // console.log('file', file);
    const content = await readFile(file);
    fileMap[path] = content;
  }
  // console.log(fileMap)
  alert('代码已实装');
}
loadFileInput.addEventListener('change', loadFile);


const routers: RouterItem[] = [];
let dirName = '';

function getDirName(path: string) {
  return path.split('/')[0];
}

const Path = {
  absolute: function(current: string, path: string) {
    return current + path;
  },
};

function triggerOnLoad(pageInstance) {
  if (pageInstance.onLoad && typeof (pageInstance.onLoad) === "function") {
    (pageInstance.onLoad as Function).call(pageInstance);
  }
}

function triggerOnShow(pageInstance) {
  if (pageInstance.onShow && typeof (pageInstance.onShow) === "function") {
    (pageInstance.onShow as Function).call(pageInstance);
  }
}

function getCurrentPageInstance() {
  return routers[routers.length - 1].instance;
}

function run(e: Event) {
  e.preventDefault();
  injectPage(window);
  const keys = Object.keys(fileMap);
  dirName = getDirName(keys[0]);
  const appConfig = JSON.parse(fileMap[dirName + '/app.json']);
  const firstPage = appConfig.pages[0];
  const pagePath = dirName + Path.absolute('/', firstPage);
  loadPage(pagePath, fileMap[pagePath + '.js']);
  routers.push({
    path: pagePath,
    instance: getPageStore()[pagePath],
  });
  const instance = routers[0].instance;
  triggerOnLoad(instance);
  triggerOnShow(instance);
  const shadow = createRootMountPoint(mountPosition);
  mountBaseStyle(shadow);

  const wxPage = createPage(shadow);
  mountPageStyle(shadow, replaceName(fileMap[pagePath + '.wxss'], wxPage));
  const handler = getHandler(getCurrentPageInstance);
  wxPage.addEventListener('click', handler);
  const bilders = parser(fileMap[pagePath + '.wxml']);
  let prev = render(bilders, instance.data, wxPage);
  instance.__pageElement = wxPage;
  instance.__pageBuilderFunc = bilders;
  instance.__pageStateTree = prev;
  instance.__updater = debounce(function() {
    this.__pageStateTree = updater(this.__pageBuilderFunc, this.data, this.__pageElement, this.__pageStateTree);
  });
}
runButton.addEventListener('click', run);

