export const ModelEventTypes = {
  Project: {
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
    listAll: 'modelprojectlistall', // without pagination
    Folder: {
      create: 'projectfoldercreate',
      delete: 'projectfolderdelete',
      update: 'projectfolderupdate',
    },
    Request: {
      create: 'projectrequestcreate',
      delete: 'projectrequestdelete',
      update: 'projectrequestupdate',
    },
    Environment: {
      create: 'projectenvironmentcreate',
      delete: 'projectenvironmentdelete',
      update: 'projectenvironmentupdate',
    },
    State: {
      update: 'projectstateupdate',
      delete: 'projectstatedelete',
    }
  },
}
