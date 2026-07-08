// Endpoint paths exposed by LoanController on the backend (Constants.LOANS_PATH = /api/loans).
export const LOAN_ENDPOINTS = {
    APPLY: '/loans/apply',
    ALL: '/loans',
    MINE: '/loans/mine',
    BY_ID: (id: string) => `/loans/${id}`,
};
