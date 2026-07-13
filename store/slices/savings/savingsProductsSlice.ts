import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, SAVINGS_PRODUCT_ENDPOINTS } from '../../../urlhelper';

export type SavingsProductType = 'ORDINARY' | 'SHARE_CAPITAL' | 'FIXED_DEPOSIT' | 'SPECIAL';

// Matches SavingsProductResponse on the backend.
export interface SavingsProduct {
    id: string;
    savingsProductType: SavingsProductType;
    name: string;
    description?: string;
    interestRate: number;
    minimumOpeningBalance: number;
    minimumBalance: number;
    withdrawable: boolean;
    active: boolean;
}

// Matches SavingsProductRequest on the backend.
export interface SavingsProductPayload {
    savingsProductType: SavingsProductType;
    name: string;
    description?: string;
    interestRate: number;
    minimumOpeningBalance: number;
    minimumBalance: number;
    withdrawable: boolean;
    active: boolean;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface SavingsProductsState {
    products: SavingsProduct[];
    loading: boolean;
    error: string | null;
    saving: boolean;
}

const initialState: SavingsProductsState = {
    products: [],
    loading: false,
    error: null,
    saving: false,
};

export const fetchSavingsProducts = createAsyncThunk('savingsProducts/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<SavingsProduct[]>>(SAVINGS_PRODUCT_ENDPOINTS.ALL);
    return response.data;
});

export const createSavingsProduct = createAsyncThunk('savingsProducts/create', async (payload: SavingsProductPayload) => {
    const response = await apiPost<BackendEnvelope<SavingsProduct>>(SAVINGS_PRODUCT_ENDPOINTS.ALL, payload);
    return response.data;
});

export const updateSavingsProduct = createAsyncThunk('savingsProducts/update', async ({ id, payload }: { id: string; payload: SavingsProductPayload }) => {
    const response = await apiPut<BackendEnvelope<SavingsProduct>>(SAVINGS_PRODUCT_ENDPOINTS.BY_ID(id), payload);
    return response.data;
});

export const toggleSavingsProductActive = createAsyncThunk('savingsProducts/toggleActive', async (id: string) => {
    const response = await apiPatch<BackendEnvelope<SavingsProduct>>(SAVINGS_PRODUCT_ENDPOINTS.TOGGLE_ACTIVE(id));
    return response.data;
});

export const deleteSavingsProduct = createAsyncThunk('savingsProducts/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(SAVINGS_PRODUCT_ENDPOINTS.BY_ID(id));
    return id;
});

const savingsProductsSlice = createSlice({
    name: 'savingsProducts',
    initialState,
    reducers: {
        clearSavingsProductsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSavingsProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSavingsProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(fetchSavingsProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load savings products';
            })
            .addCase(createSavingsProduct.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createSavingsProduct.fulfilled, (state, action) => {
                state.saving = false;
                state.products = [...state.products, action.payload];
            })
            .addCase(createSavingsProduct.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create savings product';
            })
            .addCase(updateSavingsProduct.fulfilled, (state, action) => {
                state.products = state.products.map((product) => (product.id === action.payload.id ? action.payload : product));
            })
            .addCase(toggleSavingsProductActive.fulfilled, (state, action) => {
                state.products = state.products.map((product) => (product.id === action.payload.id ? action.payload : product));
            })
            .addCase(deleteSavingsProduct.fulfilled, (state, action) => {
                state.products = state.products.filter((product) => product.id !== action.payload);
            });
    },
});

export const { clearSavingsProductsError } = savingsProductsSlice.actions;
export default savingsProductsSlice.reducer;
