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
  Project: Object.freeze({
    create: 'storeprojectcreate',
    read: 'storeprojectread',
    update: 'storeprojectupdate',
    delete: 'storeprojectdelete',
    /** 
     * Moves objects inside a project between position and/or folders.
     */
    move: 'storeprojectmove',
    /** 
     * Makes a copy of the project and stores it as new.
     */
    clone: 'storeprojectclone',
    listAll: 'storeprojectlistall', // without pagination
    Folder: Object.freeze({
      create: 'storeprojectfoldercreate',
      delete: 'storeprojectfolderdelete',
      update: 'storeprojectfolderupdate',
    }),
    Request: Object.freeze({
      create: 'storeprojectrequestcreate',
      delete: 'storeprojectrequestdelete',
      update: 'storeprojectrequestupdate',
    }),
    Environment: Object.freeze({
      create: 'storeprojectenvironmentcreate',
      delete: 'storeprojectenvironmentdelete',
      update: 'storeprojectenvironmentupdate',
    }),
    State: Object.freeze({
      update: 'storeprojectstateupdate',
      delete: 'storeprojectstatedelete',
    })
  }),
}
