import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, WORKFLOW_MAPPING_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowMappingResponse on the backend.
export interface WorkflowMapping {
    id: string;
    processTypeKey: string;
    workFlowId: string;
    workFlowName: string;
    active: boolean;
}

// Matches WorkFlowMappingRequest on the backend.
export interface WorkflowMappingPayload {
    processTypeKey: string;
    workFlowId: string;
    active: boolean;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowMappingsState {
    mappings: WorkflowMapping[];
    loading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: WorkflowMappingsState = {
    mappings: [],
    loading: false,
    saving: false,
    error: null,
};

export const fetchWorkflowMappings = createAsyncThunk('workflowMappings/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowMapping[]>>(WORKFLOW_MAPPING_ENDPOINTS.ALL);
    return response.data;
});

export const createWorkflowMapping = createAsyncThunk('workflowMappings/create', async (payload: WorkflowMappingPayload) => {
    const response = await apiPost<BackendEnvelope<WorkflowMapping>>(WORKFLOW_MAPPING_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateWorkflowMapping = createAsyncThunk('workflowMappings/update', async ({ id, payload }: { id: string; payload: WorkflowMappingPayload }) => {
    const response = await apiPut<BackendEnvelope<WorkflowMapping>>(WORKFLOW_MAPPING_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteWorkflowMapping = createAsyncThunk('workflowMappings/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(WORKFLOW_MAPPING_ENDPOINTS.DELETE(id));
    return id;
});

const workflowMappingsSlice = createSlice({
    name: 'workflowMappings',
    initialState,
    reducers: {
        clearWorkflowMappingsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowMappings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowMappings.fulfilled, (state, action) => {
                state.loading = false;
                state.mappings = action.payload;
            })
            .addCase(fetchWorkflowMappings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load workflow mappings';
            })
            .addCase(createWorkflowMapping.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createWorkflowMapping.fulfilled, (state, action) => {
                state.saving = false;
                state.mappings = [...state.mappings, action.payload];
            })
            .addCase(createWorkflowMapping.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create mapping';
            })
            .addCase(updateWorkflowMapping.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateWorkflowMapping.fulfilled, (state, action) => {
                state.saving = false;
                state.mappings = state.mappings.map((mapping) => (mapping.id === action.payload.id ? action.payload : mapping));
            })
            .addCase(updateWorkflowMapping.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update mapping';
            })
            .addCase(deleteWorkflowMapping.fulfilled, (state, action) => {
                state.mappings = state.mappings.filter((mapping) => mapping.id !== action.payload);
            });
    },
});

export const { clearWorkflowMappingsError } = workflowMappingsSlice.actions;
export default workflowMappingsSlice.reducer;
