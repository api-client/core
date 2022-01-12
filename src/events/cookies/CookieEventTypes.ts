export const CookieEventTypes = Object.freeze({
  listAll: 'sessioncookielistall',
  listDomain: 'sessioncookielistdomain',
  listUrl: 'sessioncookielisturl',
  delete: 'sessioncookiedelete',
  deleteUrl: 'sessioncookiedeleteurl',
  update: 'sessioncookieupdate',
  updateBulk: 'sessioncookieupdatebulk',
  State: Object.freeze({
    delete: 'sessioncookiestatedelete',
    update: 'sessioncookiestateupdate',
  }),
});
