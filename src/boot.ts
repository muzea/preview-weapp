import { RouterItem } from './type';
import { replaceName } from './preview/style';
import { getHandler } from './preview/event';
import { parser, render } from './preview/wxml';
import { getPageStore, loadPage, injectPage } from './fuck/page';

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
  triggerOnLoad(routers[0].instance);
  triggerOnShow(routers[0].instance);
  const shadow = mountPosition.attachShadow({mode: 'open'});
  const wrapper = document.createElement('wx-page');
  wrapper.setAttribute('id','wrapper');
  shadow.appendChild(wrapper);
  const styleSheet = document.createElement('style');
  styleSheet.textContent = replaceName(fileMap[pagePath + '.wxss'], wrapper);
  const baseStyle = document.getElementById('base-style').cloneNode();
  shadow.appendChild(baseStyle);
  shadow.appendChild(styleSheet);
  const handler = getHandler(getCurrentPageInstance);
  wrapper.addEventListener('click', handler);
  const pageTree = parser(fileMap[pagePath + '.wxml']);
  let prev = render(pageTree, routers[0].instance.data);
  for (const item of prev) {
    wrapper.appendChild(item);
  }
  (window as any).iid = setInterval(() => {
    const result = render(pageTree, routers[0].instance.data);
    for (const item of prev) {
      wrapper.removeChild(item as any);
    }
    for (const item of result) {
      wrapper.appendChild(item);
    }
    prev = result;
  }, 500);
}
runButton.addEventListener('click', run);

