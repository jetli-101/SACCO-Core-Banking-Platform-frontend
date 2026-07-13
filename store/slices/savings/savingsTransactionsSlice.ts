import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiPost, SAVINGS_TRANSACTION_ENDPOINTS } from '../../../urlhelper';

export type SavingsTransactionType = 'DEPOSIT' | 'WITHDRAWAL';

// Matches SavingsTransactionResponse on the backend.
export interface SavingsTransaction {
    id: string;
    savingsAccountId: string;
    type: SavingsTransactionType;
    amount: number;
    balanceAfter: number;
    method?: string;
    narrative?: string;
    transactedAt: string;
    recordedByName?: string;
}

// Matches SavingsTransactionRequest on the backend.
export interface SavingsTransactionPayload {
    amount: number;
    transactedAt?: string;
    method?: string;
    narrative?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface SavingsTransactionsState {
    transactions: SavingsTransaction[];
    loading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: SavingsTransactionsState = {
    transactions: [],
    loading: false,
    saving: false,
    error: null,
};

export const fetchSavingsTransactions = createAsyncThunk('savingsTransactions/fetchAll', async (accountId: string) => {
    const response = await apiGet<BackendEnvelope<SavingsTransaction[]>>(SAVINGS_TRANSACTION_ENDPOINTS.ALL(accountId));
    return response.data;
});

export const depositToSavingsAccount = createAsyncThunk(
    'savingsTransactions/deposit',
    async ({ accountId, payload }: { accountId: string; payload: SavingsTransactionPayload }) => {
        const response = await apiPost<BackendEnvelope<SavingsTransaction>>(SAVINGS_TRANSACTION_ENDPOINTS.DEPOSIT(accountId), payload);
        return response.data;
    }
);

export const withdrawFromSavingsAccount = createAsyncThunk(
    'savingsTransactions/withdraw',
    async ({ accountId, payload }: { accountId: string; payload: SavingsTransactionPayload }) => {
        const response = await apiPost<BackendEnvelope<SavingsTransaction>>(SAVINGS_TRANSACTION_ENDPOINTS.WITHDRAW(accountId), payload);
        return response.data;
    }
);

const savingsTransactionsSlice = createSlice({
    name: 'savingsTransactions',
    initialState,
    reducers: {
        clearSavingsTransactionsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSavingsTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSavingsTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.transactions = action.payload;
            })
            .addCase(fetchSavingsTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load savings transactions';
            })
            .addCase(depositToSavingsAccount.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(depositToSavingsAccount.fulfilled, (state, action) => {
                state.saving = false;
                state.transactions = [action.payload, ...state.transactions];
            })
            .addCase(depositToSavingsAccount.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to record deposit';
            })
            .addCase(withdrawFromSavingsAccount.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(withdrawFromSavingsAccount.fulfilled, (state, action) => {
                state.saving = false;
                state.transactions = [action.payload, ...state.transactions];
            })
            .addCase(withdrawFromSavingsAccount.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to record withdrawal';
            });
    },
});

export const { clearSavingsTransactionsError } = savingsTransactionsSlice.actions;
export default savingsTransactionsSlice.reducer;
