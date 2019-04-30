import { pickAttr, stringifyAttr } from './lib';

interface IData {
  [key: string]: any
}

function __valueOf(expStr: string, store: any) {
  const func = new Function('env', `with(env){return ${expStr}}`);
  const env = new Proxy({}, {
    get: function(_, key){
      const value = store[key];
      return value;
    },
    has: function () {
      return true;
    },
  });
  return func(env);
}

function valueOfString(expStr: string, store: any, replaeOnly: boolean = false): any {
  // console.log('expStr - ', expStr);
  const finalExp = expStr.replace(/{{(.+?)}}/g, (_: string, exp: string) => {
    // console.log('exp - ', exp);
    const ret = __valueOf(exp, store);
    // console.log('ret - ', ret);
    return JSON.stringify(ret);
  });
  // console.log('finalExp - ', finalExp);
  if (replaeOnly) {
    return finalExp;
  }
  return __valueOf(finalExp, store);
}

function preview(mountElement: HTMLDivElement, wxml: string, store: any) {
  const container = document.createElement('div');
  container.innerHTML = wxml;
  const result = walk(container.childNodes, store);
  console.log(result);
  mountElement.innerHTML = result;
}



function renderElement(node: Element, store: any): string {
  const attr = pickAttr(node.attributes, ['class']);
  let ret = `<${node.localName} ${stringifyAttr(attr)}>`;
  if (node.childNodes.length) {
    ret += walk(node.childNodes, store);
  } else {
    console.log('why', node);
  }
  ret += `</${node.localName}>`;
  return ret
}

function renderText(node: Node, store: any):string {
  return valueOfString(node.textContent, store, true);
}

type IForResult = {
  has: true
  listExp: string
  itemName: string
  indexName: string
} | {
  has: false
}

function checkFor(node: Element): IForResult {
  let forAttr = node.attributes['wx:for'];
  if (forAttr === undefined) {
    return {
      has: false,
    };
  }
  const itemName = node.attributes['wx:for-item'];
  const indexName = node.attributes['wx:for-index'];
  return {
    has: true,
    listExp: forAttr.value,
    itemName: itemName ? itemName.value : 'item',
    indexName: indexName ? indexName.value : 'index',
  };
}

function checkIf(node: Element, store: any): boolean {
  let ifAttr = node.attributes['wx:if'];
  if (ifAttr === undefined) {
    return true;
  }
  return valueOfString(ifAttr.value, store);
}

function isElement(ele: Node):ele is Element {
  return ele.nodeType === ele.ELEMENT_NODE;
}

function walk(nodes: NodeListOf<ChildNode>, store: any):string {
  let ret = '';
  for (const node of nodes) {
    if (isElement(node)) {
      if (!checkIf(node, store)) {
        continue;
      }
      const forResult = checkFor(node);
      if (forResult.has) {
        const { listExp, itemName, indexName } = forResult;
        // console.log(listExp, itemName, indexName);
        const list: any[] = valueOfString(listExp, store);
        // console.log(list);
        list.forEach((item, index) => {
          const nextStore = {
            ...store,
            [itemName]: item,
            [indexName]: index,
          };
          ret += renderElement(node, nextStore);
        });
        continue;
      }
      ret += renderElement(node, store);
      continue;
    }
    ret += renderText(node, store);
  }
  return ret;
}


export default preview
