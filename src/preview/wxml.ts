import { pickAttr, valueOfString, isElement } from './lib';

enum NodeType {
  view = 'view',
  text = 'text',
  button = 'button',
  content = 'content',
}

interface NodeBase {
  attr: {
    [name: string]: string
  }
  style?: string
}

interface NodeView extends NodeBase {
  type: NodeType.view
  children: WxNode[]
}

interface NodeText extends NodeBase {
  type: NodeType.text
  children: WxNode[]
}

interface NodeButton extends NodeBase {
  type: NodeType.button
  children: WxNode[]
}

interface NodeContent {
  type: NodeType.content
  content: string
}

type WxNode = NodeView | NodeText | NodeButton | NodeContent

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
  // return valueOfString(ifAttr.value, store);
}

type BuilderFunc = (store: any) => RenderResult[]

function buildElement(node: Node):BuilderFunc {
  if (isElement(node)) {
    const attr = pickAttr(node.attributes, ['id', 'class', 'bindtap']);
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
    }
    return function block(store: any) {
      if (ifResult.has && valueOfString(ifResult.ifExp, store) === false) {
        return [null];
      }
      if (forResult.has) {
        const { listExp, itemName, indexName } = forResult;
        const list: any[] = valueOfString(listExp, store);
        const ret = [];
        list.forEach((item, index) => {
          const nextStore = {
            ...store,
            [itemName]: item,
            [indexName]: index,
          };
          const currentChildren = childrenBuilder.reduce((previousValue, currentValue: BuilderFunc) => {
            return previousValue.concat(currentValue(nextStore));
          }, [] as RenderResult[]);
          ret.push({
            type,
            children: currentChildren,
            attr,
          });
        });
        return ret;
      } else {
        const children = childrenBuilder.reduce((previousValue, currentValue: BuilderFunc) => {
          return previousValue.concat(currentValue(store));
        }, [] as RenderResult[]);
        return [{
          type,
          children,
          attr,
        }];
      }
    }
  } else {
    // content
    const textContent = node.textContent;
    return function content(store: any) {
      return [{
        type: NodeType.content,
        content: valueOfString(textContent, store, true),
      }];
    }
  }
}

function renderElement(node: WxNode): Element {
  let tagName = `wx-${node.type}`;
  const result = document.createElement(tagName, {});
  for (const child of (node as NodeView | NodeText | NodeButton).children) {
    if (child.type === NodeType.content) {
      const text = document.createTextNode(child.content);
      result.appendChild(text);
    } else {
      result.appendChild(renderElement(child));
    }
  }
  return result;
}

function render(builderList: BuilderFunc[], store: any) {
  const stateTree = builderList.map(builder => builder(store));
  const result: Element[] = [];
  for (const tree of stateTree) {
    for (const node of tree) {
      result.push(renderElement(node));
    }
  }
  return result;
}

export {
  parser,
  render,
};
