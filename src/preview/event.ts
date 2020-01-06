import { IGetCurrentPageInstance } from '../type';

function getBindtap(element: HTMLElement) {
  const value = element.getAttribute('bindtap');
  return value;
}

function triggerTap(currentElement: HTMLElement, target: HTMLElement, pageInstance: any) {
  const bindtap = getBindtap(currentElement);
  if (bindtap) {
    (pageInstance[bindtap] as Function).call(pageInstance, { target });
  }
}

function getHandler(getCurrentPageInstance: IGetCurrentPageInstance) {
  return function proxyEvent(event: Event) {
    const eventSource = event.target as HTMLElement;
    const pageInstance = getCurrentPageInstance();
    let currentElement = eventSource;
    let limit = 10;
    while (currentElement.id !== 'wrapper' && limit) {
      triggerTap(currentElement, eventSource, pageInstance);
      currentElement = currentElement.parentElement;
      --limit;
    }
  };
}

export { getHandler };
