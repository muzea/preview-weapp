function debounce<T extends Function>(fn: T, wait = 30): T {
  let lastArguments;
  let timer = 0;
  return function(...rest) {
    lastArguments = rest;
    if (timer === 0) {
      setTimeout(() => {
        timer = 0;
        fn.apply(this, lastArguments);
      }, wait);
    }
  } as any;
}

function isFunction(func: any) {
  return typeof func === 'function';
}

export { debounce, isFunction };
