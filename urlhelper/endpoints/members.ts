// Endpoint paths exposed by MemberController on the backend.
export const MEMBER_ENDPOINTS = {
    ALL: '/members',
    ME: '/members/me',
    PENDING: '/members/pending',
    APPROVE: (id: string) => `/members/${id}/approve`,
    REJECT: (id: string) => `/members/${id}/reject`,
    BY_ID: (id: string) => `/members/${id}`,
};
