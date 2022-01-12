export const AuthorizationEventTypes = Object.freeze({
  OAuth2: Object.freeze({
    /** 
     * Authorization with auth configuration on detail
     */
    authorize: 'oauth2authorize',
    /** 
     * Removes cached token for the provider
     */
    removeToken: 'oauth2removetoken',
  }),
  Oidc: Object.freeze({
    /** 
     * Authorization the user with the provided configuration.
     */
    authorize: 'oidcauthorize',
    /** 
     * Removes cached tokens for the provider
     */
    removeTokens: 'oidcremovetokens',
  }),
});
