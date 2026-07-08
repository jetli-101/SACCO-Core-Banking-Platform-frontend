import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiPost, LOAN_ENDPOINTS } from '../../../urlhelper';

export type LoanType = 'NORMAL' | 'DEVELOPMENT' | 'EMERGENCY' | 'SCHOOL_FEES';

// Matches LoanResponse on the backend.
export interface Loan {
    id: string;
    memberId: string;
    memberName: string;
    memberNumber?: string;
    loanType: LoanType;
    amountApplied: number;
    amountApproved?: number;
    interestRate?: number;
    repaymentPeriodMonths: number;
    purpose?: string;
    disbursedAmount?: number;
    disbursedAt?: string;
    appliedAt: string;

    workflowInstanceId?: string;
    status?: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
    currentStageName?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Matches LoanRequest on the backend.
export interface LoanApplicationPayload {
    loanType: LoanType;
    amountApplied: number;
    repaymentPeriodMonths: number;
    purpose?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface LoansState {
    loans: Loan[];
    myLoans: Loan[];
    selectedLoan: Loan | null;
    loading: boolean;
    selectedLoanLoading: boolean;
    error: string | null;
    applying: boolean;
}

const initialState: LoansState = {
    loans: [],
    myLoans: [],
    selectedLoan: null,
    loading: false,
    selectedLoanLoading: false,
    error: null,
    applying: false,
};

export const applyForLoan = createAsyncThunk('loans/apply', async (payload: LoanApplicationPayload) => {
    const response = await apiPost<BackendEnvelope<Loan>>(LOAN_ENDPOINTS.APPLY, payload);
    return response.data;
});

export const fetchLoans = createAsyncThunk('loans/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<Loan[]>>(LOAN_ENDPOINTS.ALL);
    return response.data;
});

export const fetchMyLoans = createAsyncThunk('loans/fetchMine', async () => {
    const response = await apiGet<BackendEnvelope<Loan[]>>(LOAN_ENDPOINTS.MINE);
    return response.data;
});

export const fetchLoanById = createAsyncThunk('loans/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<Loan>>(LOAN_ENDPOINTS.BY_ID(id));
    return response.data;
});

const loansSlice = createSlice({
    name: 'loans',
    initialState,
    reducers: {
        clearLoansError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLoans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLoans.fulfilled, (state, action) => {
                state.loading = false;
                state.loans = action.payload;
            })
            .addCase(fetchLoans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load loans';
            })
            .addCase(fetchMyLoans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyLoans.fulfilled, (state, action) => {
                state.loading = false;
                state.myLoans = action.payload;
            })
            .addCase(fetchMyLoans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load your loans';
            })
            .addCase(applyForLoan.pending, (state) => {
                state.applying = true;
                state.error = null;
            })
            .addCase(applyForLoan.fulfilled, (state, action) => {
                state.applying = false;
                state.myLoans = [action.payload, ...state.myLoans];
            })
            .addCase(applyForLoan.rejected, (state, action) => {
                state.applying = false;
                state.error = action.error.message || 'Unable to submit loan application';
            })
            .addCase(fetchLoanById.pending, (state) => {
                state.selectedLoanLoading = true;
                state.error = null;
            })
            .addCase(fetchLoanById.fulfilled, (state, action) => {
                state.selectedLoanLoading = false;
                state.selectedLoan = action.payload;
            })
            .addCase(fetchLoanById.rejected, (state, action) => {
                state.selectedLoanLoading = false;
                state.error = action.error.message || 'Unable to load loan';
            });
    },
});

export const { clearLoansError } = loansSlice.actions;
export default loansSlice.reducer;
