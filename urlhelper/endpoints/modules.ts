// Endpoint paths exposed by ModuleRegisterController / ModuleTypeController on the backend.
// Note the delete paths are NOT symmetric between the two controllers — that's a quirk
// of the backend's actual routes, not a typo here:
//   modules:      DELETE /modules/delete/{id}
//   module-types: DELETE /module-types/{id}
export const MODULE_ENDPOINTS = {
    ALL: '/modules/all',
    BY_ID: (id: string) => `/modules/${id}`,
    CREATE: '/modules/create',
    UPDATE: (id: string) => `/modules/update/${id}`,
    DELETE: (id: string) => `/modules/delete/${id}`,
    ROLES: (id: string) => `/modules/${id}/roles`,
};

export const MODULE_TYPE_ENDPOINTS = {
    ALL: '/module-types/all',
    BY_ID: (id: string) => `/module-types/${id}`,
    CREATE: '/module-types/create',
    UPDATE: (id: string) => `/module-types/update/${id}`,
    DELETE: (id: string) => `/module-types/${id}`,
};
