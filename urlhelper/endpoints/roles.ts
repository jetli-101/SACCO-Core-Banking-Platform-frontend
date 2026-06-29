// Endpoint paths exposed by RoleController on the backend (Constants.ROLES_PATH = /api/roles).
export const ROLE_ENDPOINTS = {
    ALL: '/roles',
    BY_ID: (id: string) => `/roles/${id}`,
    CREATE: '/roles',
    UPDATE: (id: string) => `/roles/${id}`,
    DELETE: (id: string) => `/roles/${id}`,
    MODULES: (roleId: string) => `/roles/${roleId}/modules`,
    MEMBERS: (roleId: string) => `/roles/${roleId}/members`,
    REMOVE_MEMBER: (roleId: string, userId: string) => `/roles/${roleId}/members/${userId}`,
};
