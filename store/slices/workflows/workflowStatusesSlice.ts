import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, WORKFLOW_STATUS_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowStatusResponse on the backend.
export interface WorkflowStatus {
    id: string;
    name: string;
    textId: string;
    description?: string;
}

// Matches WorkFlowStatusRequest on the backend.
export interface WorkflowStatusPayload {
    name: string;
    textId: string;
    description?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowStatusesState {
    statuses: WorkflowStatus[];
    loading: boolean;
    error: string | null;
    saving: boolean;
}

const initialState: WorkflowStatusesState = {
    statuses: [],
    loading: false,
    error: null,
    saving: false,
};

const byName = (list: WorkflowStatus[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

export const fetchWorkflowStatuses = createAsyncThunk('workflowStatuses/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowStatus[]>>(WORKFLOW_STATUS_ENDPOINTS.ALL);
    return response.data;
});

export const createWorkflowStatus = createAsyncThunk('workflowStatuses/create', async (payload: WorkflowStatusPayload) => {
    const response = await apiPost<BackendEnvelope<WorkflowStatus>>(WORKFLOW_STATUS_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateWorkflowStatus = createAsyncThunk('workflowStatuses/update', async ({ id, payload }: { id: string; payload: WorkflowStatusPayload }) => {
    const response = await apiPut<BackendEnvelope<WorkflowStatus>>(WORKFLOW_STATUS_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteWorkflowStatus = createAsyncThunk('workflowStatuses/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(WORKFLOW_STATUS_ENDPOINTS.DELETE(id));
    return id;
});

const workflowStatusesSlice = createSlice({
    name: 'workflowStatuses',
    initialState,
    reducers: {
        clearWorkflowStatusesError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowStatuses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowStatuses.fulfilled, (state, action) => {
                state.loading = false;
                state.statuses = byName(action.payload);
            })
            .addCase(fetchWorkflowStatuses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load statuses';
            })
            .addCase(createWorkflowStatus.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createWorkflowStatus.fulfilled, (state, action) => {
                state.saving = false;
                state.statuses = byName([...state.statuses, action.payload]);
            })
            .addCase(createWorkflowStatus.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create status';
            })
            .addCase(updateWorkflowStatus.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateWorkflowStatus.fulfilled, (state, action) => {
                state.saving = false;
                state.statuses = byName(state.statuses.map((status) => (status.id === action.payload.id ? action.payload : status)));
            })
            .addCase(updateWorkflowStatus.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update status';
            })
            .addCase(deleteWorkflowStatus.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteWorkflowStatus.fulfilled, (state, action) => {
                state.saving = false;
                state.statuses = state.statuses.filter((status) => status.id !== action.payload);
            })
            .addCase(deleteWorkflowStatus.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete status';
            });
    },
});

export const { clearWorkflowStatusesError } = workflowStatusesSlice.actions;
export default workflowStatusesSlice.reducer;
