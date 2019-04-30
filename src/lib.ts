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

export {
  pickAttr,
  stringifyAttr,
};
