var ctor: typeof CustomEvent;

if (typeof CustomEvent === 'function') {
  ctor = CustomEvent;
} else {
  const detailSymbol = Symbol('detail');
  ctor = class CustomEvent<T> extends Event {
    [detailSymbol]: T;

    get detail(): T {
      return this[detailSymbol];
    }

    constructor(type: string, eventInitDict?: CustomEventInit | undefined) {
      super(type, eventInitDict);
      if (eventInitDict && eventInitDict.detail) {
        this[detailSymbol] = eventInitDict.detail;
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this[detailSymbol] = null;
      }
    }

    initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: T): void {
      throw new Error(`This is deprecated. Do not use this function.`);
    }
  }
}

export default ctor;
