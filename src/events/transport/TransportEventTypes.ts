export const TransportEventTypes = Object.freeze({
  /** 
   * Transport via the CoreEngine.
   */
  Core: Object.freeze({
    // sends a request
    send: 'coretransportsend',
  }),
  /** 
   * Transport via the native platform's bindings.
   */
  Http: Object.freeze({
    send: 'httptransportsend',
  }),

  // project runner
  Project: Object.freeze({
    // for both a request or a folder (since it's all single configuration.)
    send: 'transportprojectsend',
  }),

  // web sockets.
  Ws: Object.freeze({
    /** 
     * Informs to make a connection. Used by web sockets.
     */
    connect: 'wstransportconnect',
    /** 
     * Informs to close the current connection. Used by web sockets.
     */
    disconnect: 'wstransportdisconnect',
    /** 
     * Informs to send a data on the current connection. Used by web sockets.
     */
    send: 'wstransportsend',
  }),
});
