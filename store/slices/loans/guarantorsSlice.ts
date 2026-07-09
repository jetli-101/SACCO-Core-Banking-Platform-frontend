import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, GUARANTOR_ENDPOINTS } from '../../../urlhelper';

export type GuarantorStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

// Matches GuarantorResponse on the backend.
export interface Guarantor {
    id: string;
    loanId: string;
    memberId: string;
    memberName: string;
    memberNumber?: string;
    memberAvatarUrl?: string;
    guaranteedAmount?: number;
    status: GuarantorStatus;
    respondedAt?: string;
}

// Matches GuarantorRequest on the backend.
export interface GuarantorPayload {
    memberId: string;
    guaranteedAmount?: number;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface GuarantorsState {
    guarantors: Guarantor[];
    loading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: GuarantorsState = {
    guarantors: [],
    loading: false,
    saving: false,
    error: null,
};

export const fetchGuarantors = createAsyncThunk('guarantors/fetchAll', async (loanId: string) => {
    const response = await apiGet<BackendEnvelope<Guarantor[]>>(GUARANTOR_ENDPOINTS.ALL(loanId));
    return response.data;
});

export const addGuarantor = createAsyncThunk('guarantors/add', async ({ loanId, payload }: { loanId: string; payload: GuarantorPayload }) => {
    const response = await apiPost<BackendEnvelope<Guarantor>>(GUARANTOR_ENDPOINTS.ALL(loanId), payload);
    return response.data;
});

export const respondToGuarantorInvite = createAsyncThunk(
    'guarantors/respond',
    async ({ loanId, guarantorId, decision }: { loanId: string; guarantorId: string; decision: 'ACCEPTED' | 'DECLINED' }) => {
        const response = await apiPut<BackendEnvelope<Guarantor>>(GUARANTOR_ENDPOINTS.RESPOND(loanId, guarantorId), { decision });
        return response.data;
    }
);

export const removeGuarantor = createAsyncThunk('guarantors/remove', async ({ loanId, guarantorId }: { loanId: string; guarantorId: string }) => {
    await apiDelete<BackendEnvelope<null>>(GUARANTOR_ENDPOINTS.REMOVE(loanId, guarantorId));
    return guarantorId;
});

const guarantorsSlice = createSlice({
    name: 'guarantors',
    initialState,
    reducers: {
        clearGuarantorsError(state) {
            state.error = null;
        },
        resetGuarantors(state) {
            state.guarantors = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGuarantors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGuarantors.fulfilled, (state, action) => {
                state.loading = false;
                state.guarantors = action.payload;
            })
            .addCase(fetchGuarantors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load guarantors';
            })
            .addCase(addGuarantor.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(addGuarantor.fulfilled, (state, action) => {
                state.saving = false;
                state.guarantors = [...state.guarantors, action.payload];
            })
            .addCase(addGuarantor.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to add guarantor';
            })
            .addCase(respondToGuarantorInvite.fulfilled, (state, action) => {
                state.guarantors = state.guarantors.map((guarantor) => (guarantor.id === action.payload.id ? action.payload : guarantor));
            })
            .addCase(removeGuarantor.fulfilled, (state, action) => {
                state.guarantors = state.guarantors.filter((guarantor) => guarantor.id !== action.payload);
            });
    },
});

export const { clearGuarantorsError, resetGuarantors } = guarantorsSlice.actions;
export default guarantorsSlice.reducer;
