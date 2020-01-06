interface JsModule {
  exports: any;
  dependencies: any[];
  require: (dependencyPath: string) => any;
}

let fileMap: { [name: string]: string } = {};
let exportMap: { [path: string]: JsModule } = {};

function pathResolve(current: string, path: string): string {
  if (path.startsWith('.')) {
    path = path.substring(1);
  }
  if (path.startsWith('/')) {
    return path;
  }
  const paths = path.split('/').filter(it => it.length);
  const base = current.split('/');
  for (const item of paths) {
    if (item === '..') {
      base.pop();
      continue;
    }
    base.push(item);
  }
  const ret = '/' + base.join('/');
  if (fileMap[ret]) {
    return ret;
  }
  if (fileMap[ret + '.js']) {
    return ret + '.js';
  }
  throw new Error('找不到文件');
}

function relativeFile(current: string, fileName: string) {
  const paths = current.split('/');
  const last = paths.pop();
  if (!last.includes('.')) {
    throw new Error('文件名不对');
  }
  paths.push(fileName);
  const realPath = paths.join('/');
  if (fileMap[realPath]) {
    return fileMap[realPath];
  }
  throw new Error('文件名不对');
}

function requirePage(path: string, injectVars: { [name: string]: any } = {}) {
  const code = fileMap[path];
  const keys = Object.keys(injectVars);
  const func = new Function(...keys, code);
  func(...keys.map(k => injectVars[k]));
}

function requireJs(path: string): any {
  if (exportMap[path]) {
    return exportMap[path];
  }
  const jsModule = {
    exports: {},
    dependencies: [],
    require: async (dependencyPath: string) => {
      const realPath = pathResolve(path, dependencyPath);
      if (!jsModule.dependencies.includes(realPath)) {
        jsModule.dependencies.push(realPath);
      }
      if (exportMap[realPath]) {
        return exportMap[realPath].exports;
      }
      return requireJs(realPath);
    },
  };
  exportMap[path] = jsModule;
  const code = fileMap[path];
  const func = new Function('module', code);
  func(jsModule);
  return jsModule.exports;
}

function readFile(file: any): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = function(evt) {
      // console.log('onload', evt);
      resolve((evt.target as any).result);
    };
    reader.onerror = function() {
      throw new Error('cannot read file');
    };
  });
}

async function loadFileViaInput(evt: Event) {
  const files = (evt.target as any).files as any[];
  const end = files.length;
  const prefix: string = files[0].webkitRelativePath.split('/')[0];
  const prefixLength = prefix.length;
  for (let i = 0; i < end; i++) {
    const file = files[i];
    const path = file.webkitRelativePath as string;
    if (file.name.startsWith('.')) {
      continue;
    }
    // console.log('file', file);
    const content = await readFile(file);
    fileMap[path.substring(prefixLength)] = content;
  }
  // console.log(fileMap);
  alert('代码已实装');
}

function getContent(path: string) {
  return fileMap[path];
}

export { requirePage, loadFileViaInput, requireJs, getContent, pathResolve, relativeFile };
