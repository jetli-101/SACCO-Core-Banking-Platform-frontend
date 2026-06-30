// Endpoint paths exposed by UserController on the backend (Constants.USERS_PATH = /api/users).
export const USER_ENDPOINTS = {
    ALL: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    STATUS: (id: string) => `/users/${id}/status`,
    ME: '/users/me',
    ME_PHOTO: '/users/me/photo',
};
