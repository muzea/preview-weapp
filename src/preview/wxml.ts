import { pickAttr, valueOfString, isElement, valueOfStringIfHasExp } from './lib';

enum NodeType {
  view = 'view',
  text = 'text',
  button = 'button',
  img = 'img',
  _img = 'image',
  content = 'content',
}

interface NodeBase {
  attr?: {
    [name: string]: string
  }
  style?: string
}

interface NodeView extends NodeBase {
  type: NodeType.view
  children: WxNode[][]
}

interface NodeText extends NodeBase {
  type: NodeType.text
  children: WxNode[][]
}

interface NodeButton extends NodeBase {
  type: NodeType.button
  children: WxNode[][]
}

interface NodeImage extends NodeBase {
  type: NodeType._img
  children: WxNode[][]
}

interface NodeContent {
  type: NodeType.content
  content: string
}

type TagNode = NodeView | NodeText | NodeButton

type WxNode = NodeView | NodeText | NodeButton | NodeContent | NodeImage

interface StateTreeNode extends NodeBase {
  el: Node
  type: NodeType
  content?: string
  children?: StateTreeNode[][]
}

type BuilderResult = WxNode

type RenderResult = BuilderResult | null

function parser(wxml: string) {
  const container = document.createElement('div');
  container.innerHTML = wxml;
  const result: BuilderFunc[] = [];
  for (const item of container.children) {
    result.push(buildElement(item));
  }
  return result;
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

type IIfResult = {
  has: true
  ifExp: string
} | {
  has: false
}

function checkIf(node: Element): IIfResult {
  let ifAttr = node.attributes['wx:if'];
  if (ifAttr === undefined) {
    return {
      has: false,
    };
  }
  return {
    has: true,
    ifExp: ifAttr.value,
  };
}

type BuilderFunc = (store: any) => RenderResult[]

function buildElement(node: Node):BuilderFunc {
  if (isElement(node)) {
    const childrenBuilder: BuilderFunc[] = [];
    for (const it of node.childNodes) {
      childrenBuilder.push(buildElement(it));
    }
    const forResult = checkFor(node);
    const ifResult = checkIf(node);
    let type;
    switch ( node.localName) {
      case NodeType.view:
        type = NodeType.view;
        break;
      case NodeType.button:
        type = NodeType.button;
        break;
      case NodeType.text:
        type = NodeType.text;
        break;
      case NodeType.img:
        type = NodeType._img;
        break;
    }
    return function block(store: any):TagNode[] {
      const attr = (Object as any).values({...node.attributes}).map(_attr => {
        return {
          key: _attr.name,
          value: valueOfStringIfHasExp(_attr.textContent, store) || valueOfStringIfHasExp(_attr.value, store),
        };
      }).reduce((prev: any, item) => {
        prev[item.key] = item.value;
        return prev;
      }, {});
      if (node.localName === 'img') {
        console.log('attrs', attr)
      }
      if (ifResult.has && valueOfString(ifResult.ifExp, store) === false) {
        return [null];
      }
      if (forResult.has) {
        const { listExp, itemName, indexName } = forResult;
        const list: any[] = valueOfString(listExp, store);
        const ret:TagNode[] = [];
        if (!Array.isArray(list)) {
          return ret;
        }
        list.forEach((item, index) => {
          const nextStore = {
            ...store,
            [itemName]: item,
            [indexName]: index,
          };
          const currentChildren = childrenBuilder.map(b => b(nextStore));
          ret.push({
            type,
            children: currentChildren,
            attr,
          });
        });
        return ret;
      } else {
        const children = childrenBuilder.map(b => b(store));
        return [{
          type,
          children,
          attr,
        }];
      }
    }
  } else {
    // content
    // 非顶级元素才可能是 content
    const textContent = node.textContent;
    return function content(store: any) {
      return [{
        type: NodeType.content,
        content: valueOfString(textContent, store, true),
      }] as any;
    }
  }
}

function renderText(node: NodeContent): Node {
  const result = document.createTextNode(node.content);
  return result;
}

function renderElement(node: WxNode): Element {
  let tagName = `wx-${node.type}`;
  const result = document.createElement(tagName, {});
  const { attr } = (node as TagNode);
  if (attr) {
    if (node.type === NodeType._img) {
      let fixImage = '';
      if (attr.src) {
        fixImage = `background-image: url('${attr.src}'); background-size: cover;`
      }
      attr.style = (attr.style || '') + fixImage;
    }
    Object.keys(attr).forEach(k => {
      result.setAttribute(k, attr[k])
    });
  }
  return result;
}

function huLuanRenderForItem(item: WxNode): StateTreeNode {
  if (item.type === NodeType.content) {
    const el = renderText(item);
    return {
      el,
      ...item,
    };
  } else {
    const el = renderElement(item);
    const children: StateTreeNode[][] = huLuanRender((item as TagNode).children, el);
    console.log('item.type', item.type);
    return {
      el,
      ...item,
      children,
    };
  }
}

function huLuanRenderForLoop(loop: WxNode[], mountPoint: Element): StateTreeNode[] {
  const loopResult: StateTreeNode[] = [];
  for (const node of loop) {
    if (node !== null) {
      const item = huLuanRenderForItem(node);
      mountPoint.appendChild(item.el);
      loopResult.push(item);
    } else {
      loopResult.push(null);
    }
  }
  return loopResult;
}

function huLuanRender(stateTree: WxNode[][], mountPoint: Element): StateTreeNode[][] {
  return stateTree.map(loop => huLuanRenderForLoop(loop, mountPoint))
}

function render(builderList: BuilderFunc[], store: any, mountPoint: Element) {
  const stateTree = builderList.map(builder => builder(store));
  return huLuanRender(stateTree, mountPoint);
}

function isSameTag(a: WxNode, b: StateTreeNode) {
  return a.type === b.type;
}

function canUpdateItem(a: WxNode, b: StateTreeNode) {
  if (a === null && b === null) return true;
  if (a !== null && b !== null) return true;
  return false;
}

function canUpdateLoop(now: WxNode[], prev: StateTreeNode[]) {
  if (now.length !== prev.length) return false;
  let itemIndex = 0;
  const itemEnd = now.length;
  while(itemIndex !== itemEnd) {
    if (!canUpdateItem(now[itemIndex], prev[itemIndex])) return false;
    itemIndex++;
  }
  return true;
}

function canUpdate(now: WxNode[][], prev: StateTreeNode[][]) {
  if (now.length !== prev.length) return false;
  let loopIndex = 0;
  const loopEnd = now.length;
  while(loopIndex !== loopEnd) {
    if (!canUpdateLoop(now[loopIndex], prev[loopIndex])) return false;
    loopIndex++;
  }
  return true;
}

function itemCanUpdate(a: WxNode, b: StateTreeNode) {
  return a !== null && b !== null && isSameTag(a, b);
}

function itemNeedReplaceOld(a: WxNode, b: StateTreeNode) {
  return a !== null && b !== null && !isSameTag(a, b);
}

function updateAttr(now: WxNode, prev: StateTreeNode) {
  const el = prev.el as Element;
  const { attr } = (now as TagNode);
  const { attr: prevAttr } = prev;
  const attrKeys = Object.keys(attr);
  const prevAttrKeys = Object.keys(prevAttr);
  if (prevAttrKeys.length === 0) {
    attrKeys.forEach(k => {
      el.setAttribute(k, attr[k]);
    });
    return;
  }
  if (attrKeys.length === 0) {
    prevAttrKeys.forEach(k => {
      el.removeAttribute(k);
    });
    return;
  }
  prevAttrKeys.forEach(k => {
    if (!attrKeys.includes(k)) {
      el.removeAttribute(k);
    }
  });
  attrKeys.forEach(k => {
    if (!prevAttrKeys.includes(k) || attr[k] !== prevAttr[k]) {
      el.setAttribute(k, attr[k]);
      return;
    }
  });
}

function huLuanUpdater(stateTree: WxNode[][], mountPoint: Element, prevStateTree: StateTreeNode[][]):StateTreeNode[][] {
  if (canUpdate(stateTree, prevStateTree)) {
    stateTree.forEach((mayBeLoop, loopIndex) => {
      const prevLoop = prevStateTree[loopIndex];
      mayBeLoop.forEach((item, itemIndex) => {
        const old = prevLoop[itemIndex];
        if (itemCanUpdate(item, old)) {
          if (item.type === NodeType.content) {
            if (item.content !== old.content) {
              old.el.textContent = item.content;
              old.content = item.content;
            }
          } else {
            updateAttr(item, old);
            huLuanUpdater(item.children, old.el as Element, old.children);
          }
          return;
        }
        if (itemNeedReplaceOld(item, old)) {
          const now = huLuanRenderForItem(item);
          old.el.parentNode.replaceChild(now.el, old.el);
          prevStateTree[loopIndex][itemIndex] = now;
          return;
        }
      });
    });
    return prevStateTree;
  } else {
    for (const loop of prevStateTree) {
      for (const item of loop) {
        if (item) {
          mountPoint.removeChild(item.el);
        }
      }
    }
    return huLuanRender(stateTree, mountPoint);
  }
}

// 别看 我是乱写的
function updater(builderList: BuilderFunc[], store: any, mountPoint: HTMLElement, prevStateTree: StateTreeNode[][]) {
  // 假设最外层一定有一个标签
  const stateTree = builderList.map(builder => builder(store)) as TagNode[][];
  return huLuanUpdater(stateTree, mountPoint, prevStateTree);
}

export {
  parser,
  render,
  updater,
};
