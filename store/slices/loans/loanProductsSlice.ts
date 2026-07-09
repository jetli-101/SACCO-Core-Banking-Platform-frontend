import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, LOAN_PRODUCT_ENDPOINTS } from '../../../urlhelper';
import { LoanType } from './loansSlice';

// Matches LoanProductResponse on the backend.
export interface LoanProduct {
    id: string;
    loanType: LoanType;
    name: string;
    description?: string;
    interestRate: number;
    minAmount: number;
    maxAmount: number;
    minTermMonths: number;
    maxTermMonths: number;
    active: boolean;
}

// Matches LoanProductRequest on the backend.
export interface LoanProductPayload {
    loanType: LoanType;
    name: string;
    description?: string;
    interestRate: number;
    minAmount: number;
    maxAmount: number;
    minTermMonths: number;
    maxTermMonths: number;
    active: boolean;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface LoanProductsState {
    products: LoanProduct[];
    loading: boolean;
    error: string | null;
    saving: boolean;
}

const initialState: LoanProductsState = {
    products: [],
    loading: false,
    error: null,
    saving: false,
};

export const fetchLoanProducts = createAsyncThunk('loanProducts/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<LoanProduct[]>>(LOAN_PRODUCT_ENDPOINTS.ALL);
    return response.data;
});

export const createLoanProduct = createAsyncThunk('loanProducts/create', async (payload: LoanProductPayload) => {
    const response = await apiPost<BackendEnvelope<LoanProduct>>(LOAN_PRODUCT_ENDPOINTS.ALL, payload);
    return response.data;
});

export const updateLoanProduct = createAsyncThunk('loanProducts/update', async ({ id, payload }: { id: string; payload: LoanProductPayload }) => {
    const response = await apiPut<BackendEnvelope<LoanProduct>>(LOAN_PRODUCT_ENDPOINTS.BY_ID(id), payload);
    return response.data;
});

export const toggleLoanProductActive = createAsyncThunk('loanProducts/toggleActive', async (id: string) => {
    const response = await apiPatch<BackendEnvelope<LoanProduct>>(LOAN_PRODUCT_ENDPOINTS.TOGGLE_ACTIVE(id));
    return response.data;
});

export const deleteLoanProduct = createAsyncThunk('loanProducts/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(LOAN_PRODUCT_ENDPOINTS.BY_ID(id));
    return id;
});

const loanProductsSlice = createSlice({
    name: 'loanProducts',
    initialState,
    reducers: {
        clearLoanProductsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLoanProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLoanProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(fetchLoanProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load loan products';
            })
            .addCase(createLoanProduct.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createLoanProduct.fulfilled, (state, action) => {
                state.saving = false;
                state.products = [...state.products, action.payload];
            })
            .addCase(createLoanProduct.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create loan product';
            })
            .addCase(updateLoanProduct.fulfilled, (state, action) => {
                state.products = state.products.map((product) => (product.id === action.payload.id ? action.payload : product));
            })
            .addCase(toggleLoanProductActive.fulfilled, (state, action) => {
                state.products = state.products.map((product) => (product.id === action.payload.id ? action.payload : product));
            })
            .addCase(deleteLoanProduct.fulfilled, (state, action) => {
                state.products = state.products.filter((product) => product.id !== action.payload);
            });
    },
});

export const { clearLoanProductsError } = loanProductsSlice.actions;
export default loanProductsSlice.reducer;
