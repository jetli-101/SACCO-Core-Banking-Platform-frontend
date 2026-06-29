// Endpoint paths exposed by UserGroupController on the backend (Constants.USER_GROUPS_PATH = /api/user-groups).
export const USER_GROUP_ENDPOINTS = {
    ALL: '/user-groups',
    BY_ID: (id: string) => `/user-groups/${id}`,
    CREATE: '/user-groups',
    UPDATE: (id: string) => `/user-groups/${id}`,
    DELETE: (id: string) => `/user-groups/${id}`,
    MODULES: (groupId: string) => `/user-groups/${groupId}/modules`,
    MEMBERS: (groupId: string) => `/user-groups/${groupId}/members`,
    REMOVE_MEMBER: (groupId: string, userId: string) => `/user-groups/${groupId}/members/${userId}`,
};
