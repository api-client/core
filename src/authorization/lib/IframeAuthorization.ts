/* eslint-disable class-methods-use-this */
export const loadHandler = Symbol('loadHandler');
export const timeoutValue = Symbol('timeoutValue');
export const checkInterval = Symbol('checkInterval');
export const limitValue = Symbol('limitValue');
export const targetValue = Symbol('targetValue');

/**
 * Adds the support for the iframe authorization.
 * 
 * This class creates and loads an iframe for the given URL. Then it runs a timer recursively 
 * that increases its interval multiplying its last timeout value by 2. 
 * The the timer reaches timeout it dispatches the timeout event.
 * 
 * The library takes into the account the redirects.
 * 
 * Call the `cancel()` and the `cleanUp()` functions when the authorization data is received.
 */
export class IframeAuthorization extends EventTarget {
  loadTimeout?: any;

  timedOut = false;

  [timeoutValue] = 8;

  [limitValue]: number;

  [targetValue]: HTMLElement;

  frame?: HTMLIFrameElement;

  /**
   * @param limit The timeout limit after which the library calls timeout if it wasn't cancelled.
   * @param target A target node where to add the iframe into.
   */
  constructor(limit=1020, target:HTMLElement=document.body) {
    super();
    this[limitValue] = limit;
    this[targetValue] = target;

    this[loadHandler] = this[loadHandler].bind(this);
    this[checkInterval] = this[checkInterval].bind(this);
  }

  /**
   * A function to be called when the timer is no longer needed.
   */
  cancel(): void {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = undefined;
    }
  }

  /**
   * Removes any existing frame and removes any remaining listeners.
   */
  cleanUp(): void {
    if (!this.frame) {
      return;
    }
    this.frame.removeEventListener('load', this[loadHandler]);
    if (this.frame.parentElement) {
      this.frame.parentElement.removeChild(this.frame);
    }
    this.frame = undefined;
  }

  /**
   * Creates an invisible frame and loads the given URL
   * @param url THe resource to load.
   */
  load(url: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.border = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.overflow = 'hidden';
    iframe.addEventListener('load', this[loadHandler]);
    iframe.id = 'oauth2-authorization-frame';
    iframe.setAttribute('data-owner', 'oauth2-authorization');
    iframe.setAttribute('aria-hidden', 'true');
    this[targetValue].appendChild(iframe);
    iframe.src = url;
    this.frame = iframe;
  }

  /**
   * Handler for the `load` event on the frame.
   * @param {Event} e
   */
  [loadHandler](e: Event): void {
    this.cancel();
    const iframe = e.target as HTMLIFrameElement
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener('unload', () => {
          this.cancel();
        });
      }
    } catch (_) {
      // ...
    }

    this[timeoutValue] = 8;
    this.loadTimeout = setTimeout(this[checkInterval], this[timeoutValue]);
  }

  /**
   * A callback function that runs in the timeout.
   * It calls the timeout if the timeout value reaches the limit or increases the timeout value
   * and runs the counter once again.
   */
  [checkInterval](): void {
    if (this.timedOut) {
      return;
    }
    if (this[timeoutValue] >= this[limitValue]) {
      this.cancel();
      this.dispatchEvent(new Event('timeout'));
      this.timedOut = true;
      this.cleanUp();
      return;
    }
    this[timeoutValue] *= 2;
    this.loadTimeout = setTimeout(this[checkInterval], this[timeoutValue]);
  }
}
