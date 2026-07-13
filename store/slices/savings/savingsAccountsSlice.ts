import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiPost, SAVINGS_ENDPOINTS } from '../../../urlhelper';
import { SavingsProductType } from './savingsProductsSlice';

export type SavingsAccountStatus = 'ACTIVE' | 'DORMANT' | 'CLOSED';

// Matches SavingsAccountResponse on the backend.
export interface SavingsAccount {
    id: string;
    memberId: string;
    memberName: string;
    memberNumber?: string;
    savingsProductId: string;
    savingsProductName: string;
    savingsProductType: SavingsProductType;
    accountNumber: string;
    balance: number;
    status: SavingsAccountStatus;
    openedAt: string;
    closedAt?: string;
}

// Matches OpenSavingsAccountRequest on the backend.
export interface OpenSavingsAccountPayload {
    savingsProductId: string;
    openingDeposit?: number;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface SavingsAccountsState {
    accounts: SavingsAccount[];
    myAccounts: SavingsAccount[];
    selectedAccount: SavingsAccount | null;
    loading: boolean;
    selectedAccountLoading: boolean;
    error: string | null;
    opening: boolean;
    closing: boolean;
}

const initialState: SavingsAccountsState = {
    accounts: [],
    myAccounts: [],
    selectedAccount: null,
    loading: false,
    selectedAccountLoading: false,
    error: null,
    opening: false,
    closing: false,
};

export const openSavingsAccount = createAsyncThunk('savingsAccounts/open', async (payload: OpenSavingsAccountPayload) => {
    const response = await apiPost<BackendEnvelope<SavingsAccount>>(SAVINGS_ENDPOINTS.OPEN, payload);
    return response.data;
});

export const fetchSavingsAccounts = createAsyncThunk('savingsAccounts/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<SavingsAccount[]>>(SAVINGS_ENDPOINTS.ALL);
    return response.data;
});

export const fetchMySavingsAccounts = createAsyncThunk('savingsAccounts/fetchMine', async () => {
    const response = await apiGet<BackendEnvelope<SavingsAccount[]>>(SAVINGS_ENDPOINTS.MINE);
    return response.data;
});

export const fetchSavingsAccountById = createAsyncThunk('savingsAccounts/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<SavingsAccount>>(SAVINGS_ENDPOINTS.BY_ID(id));
    return response.data;
});

export const closeSavingsAccount = createAsyncThunk('savingsAccounts/close', async (id: string) => {
    const response = await apiPost<BackendEnvelope<SavingsAccount>>(SAVINGS_ENDPOINTS.CLOSE(id));
    return response.data;
});

const savingsAccountsSlice = createSlice({
    name: 'savingsAccounts',
    initialState,
    reducers: {
        clearSavingsAccountsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSavingsAccounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSavingsAccounts.fulfilled, (state, action) => {
                state.loading = false;
                state.accounts = action.payload;
            })
            .addCase(fetchSavingsAccounts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load savings accounts';
            })
            .addCase(fetchMySavingsAccounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMySavingsAccounts.fulfilled, (state, action) => {
                state.loading = false;
                state.myAccounts = action.payload;
            })
            .addCase(fetchMySavingsAccounts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load your savings accounts';
            })
            .addCase(openSavingsAccount.pending, (state) => {
                state.opening = true;
                state.error = null;
            })
            .addCase(openSavingsAccount.fulfilled, (state, action) => {
                state.opening = false;
                state.myAccounts = [action.payload, ...state.myAccounts];
            })
            .addCase(openSavingsAccount.rejected, (state, action) => {
                state.opening = false;
                state.error = action.error.message || 'Unable to open savings account';
            })
            .addCase(fetchSavingsAccountById.pending, (state) => {
                state.selectedAccountLoading = true;
                state.error = null;
            })
            .addCase(fetchSavingsAccountById.fulfilled, (state, action) => {
                state.selectedAccountLoading = false;
                state.selectedAccount = action.payload;
            })
            .addCase(fetchSavingsAccountById.rejected, (state, action) => {
                state.selectedAccountLoading = false;
                state.error = action.error.message || 'Unable to load savings account';
            })
            .addCase(closeSavingsAccount.pending, (state) => {
                state.closing = true;
                state.error = null;
            })
            .addCase(closeSavingsAccount.fulfilled, (state, action) => {
                state.closing = false;
                if (state.selectedAccount?.id === action.payload.id) state.selectedAccount = action.payload;
                state.accounts = state.accounts.map((account) => (account.id === action.payload.id ? action.payload : account));
                state.myAccounts = state.myAccounts.map((account) => (account.id === action.payload.id ? action.payload : account));
            })
            .addCase(closeSavingsAccount.rejected, (state, action) => {
                state.closing = false;
                state.error = action.error.message || 'Unable to close savings account';
            });
    },
});

export const { clearSavingsAccountsError } = savingsAccountsSlice.actions;
export default savingsAccountsSlice.reducer;
