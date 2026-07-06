import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, WORKFLOW_STATE_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowStateResponse on the backend — the seeded DRAFT/ACTIVE/ARCHIVED
// stage-lifecycle catalog (see WorkFlowStateSeeder). Read-only from the frontend.
export interface WorkflowState {
    id: string;
    name: string;
    textId: string;
    description?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowStatesState {
    states: WorkflowState[];
    loading: boolean;
    error: string | null;
}

const initialState: WorkflowStatesState = {
    states: [],
    loading: false,
    error: null,
};

export const fetchWorkflowStates = createAsyncThunk('workflowStates/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowState[]>>(WORKFLOW_STATE_ENDPOINTS.ALL);
    return response.data;
});

const workflowStatesSlice = createSlice({
    name: 'workflowStates',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowStates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowStates.fulfilled, (state, action) => {
                state.loading = false;
                state.states = action.payload;
            })
            .addCase(fetchWorkflowStates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load states';
            });
    },
});

export default workflowStatesSlice.reducer;
