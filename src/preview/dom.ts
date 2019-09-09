export function createRootMountPoint(mountPosition: HTMLDivElement) {
  return mountPosition.attachShadow({mode: 'open'});
}

export function createPage(app: ShadowRoot) {
  const page = document.createElement('wx-page');
  page.setAttribute('id','wrapper');
  app.appendChild(page);
  return page;
}

export function mountBaseStyle(app: ShadowRoot) {
  const baseStyle = document.getElementById('base-style').cloneNode();
  app.appendChild(baseStyle);
}

export function mountPageStyle(app: ShadowRoot, styleStr: string) {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styleStr;
  app.appendChild(styleSheet);
}
