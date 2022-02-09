declare module 'ssl-root-cas' {
  export function create(): SslRootCas;

  interface SslRootCas {
    /**
     * This is just a convenience method so that you don't have to require fs and path if you don't need them.
     * @param path 
     */
    addFile(path: string): void;
  }
}
