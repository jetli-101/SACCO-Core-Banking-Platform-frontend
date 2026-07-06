import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, WORKFLOW_INSTANCE_HISTORY_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowInstanceHistoryResponse on the backend.
export interface WorkflowInstanceHistoryEntry {
    id: string;
    fromStageId?: string;
    fromStageName?: string;
    toStageId: string;
    toStageName: string;
    transitionId?: string;
    transitionName?: string;
    comment?: string;
    performedByUserId?: string;
    performedByName?: string;
    performedAt: string;
    dataSnapshot?: Record<string, unknown>;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowInstanceHistoryState {
    entries: WorkflowInstanceHistoryEntry[];
    loading: boolean;
    error: string | null;
}

const initialState: WorkflowInstanceHistoryState = {
    entries: [],
    loading: false,
    error: null,
};

export const fetchWorkflowInstanceHistory = createAsyncThunk('workflowInstanceHistory/fetchAll', async (instanceId: string) => {
    const response = await apiGet<BackendEnvelope<WorkflowInstanceHistoryEntry[]>>(WORKFLOW_INSTANCE_HISTORY_ENDPOINTS.ALL(instanceId));
    return response.data;
});

const workflowInstanceHistorySlice = createSlice({
    name: 'workflowInstanceHistory',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowInstanceHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowInstanceHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.entries = action.payload;
            })
            .addCase(fetchWorkflowInstanceHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load history';
            });
    },
});

export default workflowInstanceHistorySlice.reducer;
