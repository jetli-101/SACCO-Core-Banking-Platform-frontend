import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, WORKFLOW_INSTANCE_HISTORY_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowOutTrayItemResponse on the backend.
export interface WorkflowOutTrayItem {
    instanceId: string;
    processCode: string;
    processName: string;
    workFlowId: string;
    workFlowName: string;
    referenceId: string;
    currentStageName: string;
    status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    initiatedAt: string;
    historyId: string;
    fromStageName?: string;
    toStageName: string;
    transitionName?: string;
    comment?: string;
    performedAt: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowOutTrayState {
    items: WorkflowOutTrayItem[];
    loading: boolean;
    error: string | null;
}

const initialState: WorkflowOutTrayState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchWorkflowOutTray = createAsyncThunk('workflowOutTray/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowOutTrayItem[]>>(WORKFLOW_INSTANCE_HISTORY_ENDPOINTS.OUT_TRAY);
    return response.data;
});

const workflowOutTraySlice = createSlice({
    name: 'workflowOutTray',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowOutTray.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowOutTray.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchWorkflowOutTray.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load out-tray';
            });
    },
});

export default workflowOutTraySlice.reducer;
