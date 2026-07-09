import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiPost, REPAYMENT_ENDPOINTS } from '../../../urlhelper';

// Matches RepaymentResponse on the backend.
export interface Repayment {
    id: string;
    loanId: string;
    amount: number;
    paidAt: string;
    method?: string;
    recordedByName?: string;
}

// Matches RepaymentRequest on the backend.
export interface RepaymentPayload {
    amount: number;
    paidAt?: string;
    method?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface RepaymentsState {
    repayments: Repayment[];
    loading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: RepaymentsState = {
    repayments: [],
    loading: false,
    saving: false,
    error: null,
};

export const fetchRepayments = createAsyncThunk('repayments/fetchAll', async (loanId: string) => {
    const response = await apiGet<BackendEnvelope<Repayment[]>>(REPAYMENT_ENDPOINTS.ALL(loanId));
    return response.data;
});

export const recordRepayment = createAsyncThunk('repayments/record', async ({ loanId, payload }: { loanId: string; payload: RepaymentPayload }) => {
    const response = await apiPost<BackendEnvelope<Repayment>>(REPAYMENT_ENDPOINTS.ALL(loanId), payload);
    return response.data;
});

const repaymentsSlice = createSlice({
    name: 'repayments',
    initialState,
    reducers: {
        clearRepaymentsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRepayments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRepayments.fulfilled, (state, action) => {
                state.loading = false;
                state.repayments = action.payload;
            })
            .addCase(fetchRepayments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load repayments';
            })
            .addCase(recordRepayment.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(recordRepayment.fulfilled, (state, action) => {
                state.saving = false;
                state.repayments = [action.payload, ...state.repayments];
            })
            .addCase(recordRepayment.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to record repayment';
            });
    },
});

export const { clearRepaymentsError } = repaymentsSlice.actions;
export default repaymentsSlice.reducer;
