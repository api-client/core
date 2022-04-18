export const ModelEventTypes = {
  ClientCertificate: Object.freeze({
    read: 'storeclientcertificateread',
    list: 'storeclientcertificatelist',
    delete: 'storeclientcertificatedelete',
    update: 'storeclientcertificateupdate',
    insert: 'storeclientcertificateinsert',
    State: Object.freeze({
      update: 'storestateclientcertificateupdate',
      delete: 'storestateclientcertificatedelete',
    }),
  }),
}
