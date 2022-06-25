export const TransportEventTypes = Object.freeze({
  /** 
   * Transport via the CoreEngine.
   */
  Core: Object.freeze({
    request: 'transportcorerequest',
    httpProject: 'transportcorehttpproject',
    appProject: 'transportcoreappproject',
  }),
  
  /** 
   * Transport via the native platform's bindings.
   */
  Http: Object.freeze({
    send: 'httptransportsend',
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
