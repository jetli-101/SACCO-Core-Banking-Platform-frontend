// SavingsController (Constants.SAVINGS_PATH = /api/savings).
export const SAVINGS_ENDPOINTS = {
    OPEN: '/savings/open',
    ALL: '/savings',
    MINE: '/savings/mine',
    BY_ID: (id: string) => `/savings/${id}`,
    CLOSE: (id: string) => `/savings/${id}/close`,
};

// SavingsProductController (Constants.SAVINGS_PRODUCTS_PATH = /api/savings-products).
export const SAVINGS_PRODUCT_ENDPOINTS = {
    ALL: '/savings-products',
    BY_ID: (id: string) => `/savings-products/${id}`,
    TOGGLE_ACTIVE: (id: string) => `/savings-products/${id}/toggle-active`,
};

// SavingsTransactionController — nested under an account (Constants.SAVINGS_PATH + /{accountId}/transactions).
export const SAVINGS_TRANSACTION_ENDPOINTS = {
    ALL: (accountId: string) => `/savings/${accountId}/transactions`,
    DEPOSIT: (accountId: string) => `/savings/${accountId}/transactions/deposit`,
    WITHDRAW: (accountId: string) => `/savings/${accountId}/transactions/withdraw`,
};
