import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, WORKFLOW_MAPPING_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowMappingResponse on the backend.
export interface WorkflowMapping {
    id: string;
    processTypeKey: string;
    workFlowId: string;
    workFlowName: string;
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
    error: string | null;
}

const initialState: WorkflowMappingsState = {
    mappings: [],
    loading: false,
    error: null,
};

export const fetchWorkflowMappings = createAsyncThunk('workflowMappings/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowMapping[]>>(WORKFLOW_MAPPING_ENDPOINTS.ALL);
    return response.data;
});

const workflowMappingsSlice = createSlice({
    name: 'workflowMappings',
    initialState,
    reducers: {},
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
            });
    },
});

export default workflowMappingsSlice.reducer;
