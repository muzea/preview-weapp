interface IStringMap {
  [k: string]: string
}

function pickAttr(obj: NamedNodeMap, keys: string[]): IStringMap {
  return keys.reduce<any>((ret: Object, key: string) => {
    const attr = obj[key];
    if (attr) {
      ret[key] = attr.value;
    }
    return ret;
  }, {});
}

function stringifyAttr(obj: IStringMap): string {
  return Object.keys(obj).reduce((prev, key) => {
    return `${prev} ${key}="${obj[key]}"`
  }, '');
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
  try {
    return func(env);
  } catch (error) {
    return undefined;
  }
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

function valueOfStringIfHasExp(expStr: string, store: any, replaeOnly: boolean = false): any {
  if (!/{{(.+?)}}/.test(expStr)) {
    return expStr;
  }
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

function isElement(ele: Node):ele is Element {
  return ele.nodeType === ele.ELEMENT_NODE;
}

export {
  pickAttr,
  stringifyAttr,
  valueOfString,
  isElement,
  valueOfStringIfHasExp,
};
