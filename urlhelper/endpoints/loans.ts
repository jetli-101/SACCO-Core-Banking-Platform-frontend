// Endpoint paths exposed by LoanController on the backend (Constants.LOANS_PATH = /api/loans).
export const LOAN_ENDPOINTS = {
    APPLY: '/loans/apply',
    ALL: '/loans',
    MINE: '/loans/mine',
    BY_ID: (id: string) => `/loans/${id}`,
    DISBURSE: (id: string) => `/loans/${id}/disburse`,
};

// LoanProductController (Constants.LOAN_PRODUCTS_PATH = /api/loan-products).
export const LOAN_PRODUCT_ENDPOINTS = {
    ALL: '/loan-products',
    BY_ID: (id: string) => `/loan-products/${id}`,
    TOGGLE_ACTIVE: (id: string) => `/loan-products/${id}/toggle-active`,
};

// GuarantorController — nested under a loan (Constants.LOANS_PATH + /{loanId}/guarantors).
export const GUARANTOR_ENDPOINTS = {
    ALL: (loanId: string) => `/loans/${loanId}/guarantors`,
    RESPOND: (loanId: string, guarantorId: string) => `/loans/${loanId}/guarantors/${guarantorId}/respond`,
    REMOVE: (loanId: string, guarantorId: string) => `/loans/${loanId}/guarantors/${guarantorId}`,
};

// RepaymentController — nested under a loan (Constants.LOANS_PATH + /{loanId}/repayments).
export const REPAYMENT_ENDPOINTS = {
    ALL: (loanId: string) => `/loans/${loanId}/repayments`,
};
