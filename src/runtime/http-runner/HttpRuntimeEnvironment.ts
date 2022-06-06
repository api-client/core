import { CookieJar } from "src/cookies/CookieJar";

/**
 * The request(s) execution environment.
 * An environment is applied to each request in the iteration (if running a project request)
 * or to the HTTP request (when running a single request).
 * 
 * In the iteration mode, the environment is shared across all requests in the iteration.
 * After that the environment is discarded and re-created for the next iteration.
 * 
 * Cookies, depending on the implementation, most likely are shared across all iterations.
 * This is why the implementation must to make sure it is safe to run the cookie functions
 * in the parallel mode of a project runner.
 */
export interface IHttpRuntimeEnvironment {
  /**
   * The computed environment variables to use with this request or iteration.
   * Variables can be changed but this change is not persistent. After each iteration
   * the environment is restored it its default values.
   */
  variables: Record<string, string>;

  /**
   * An instance of a cookie jar (store) to put/read cookies.
   */
  cookies: CookieJar;
}
