import { RouterItem } from "../type";

const routers: RouterItem[] = [];
window.routers = routers;
function getCurrentPageInstance() {
  return routers[routers.length - 1].instance;
}

function RouterPush(r: RouterItem) {
  routers.push(r);
}

function getCurrentPages() {
  return routers.map(it => it.instance);
}

export { getCurrentPageInstance, getCurrentPages, RouterPush };