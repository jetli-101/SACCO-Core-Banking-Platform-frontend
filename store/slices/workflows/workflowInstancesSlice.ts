import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, WORKFLOW_INSTANCE_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowInstanceResponse on the backend.
export interface WorkflowInstance {
    id: string;
    processCode: string;
    processName: string;
    workFlowId: string;
    workFlowName: string;
    processTypeKey: string;
    referenceId?: string;
    currentStageId: string;
    currentStageName: string;
    currentStatusId?: string;
    currentStatusName?: string;
    status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    assignedToUserId?: string;
    assignedToName?: string;
    dueDate?: string;
    daysRemaining?: number;
    initiatedByUserId?: string;
    initiatedByName?: string;
    initiatedAt: string;
    updatedAt: string;
    data?: Record<string, unknown>;
}

// Matches WorkFlowInstanceDashboardResponse on the backend — backs the stat cards on the Workflow Instances screen.
export interface WorkflowInstanceDashboard {
    activeProcesses: number;
    highPriority: number;
    dueThisWeek: number;
    rejected: number;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowInstancesState {
    instances: WorkflowInstance[];
    loading: boolean;
    error: string | null;
    dashboard: WorkflowInstanceDashboard | null;
    dashboardLoading: boolean;
}

const initialState: WorkflowInstancesState = {
    instances: [],
    loading: false,
    error: null,
    dashboard: null,
    dashboardLoading: false,
};

export const fetchWorkflowInstances = createAsyncThunk('workflowInstances/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowInstance[]>>(WORKFLOW_INSTANCE_ENDPOINTS.ALL);
    return response.data;
});

export const fetchWorkflowInstanceDashboard = createAsyncThunk('workflowInstances/fetchDashboard', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowInstanceDashboard>>(WORKFLOW_INSTANCE_ENDPOINTS.DASHBOARD);
    return response.data;
});

export const fetchWorkflowInstanceById = createAsyncThunk('workflowInstances/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<WorkflowInstance>>(WORKFLOW_INSTANCE_ENDPOINTS.BY_ID(id));
    return response.data;
});

const workflowInstancesSlice = createSlice({
    name: 'workflowInstances',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowInstances.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowInstances.fulfilled, (state, action) => {
                state.loading = false;
                state.instances = action.payload;
            })
            .addCase(fetchWorkflowInstances.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load process instances';
            })
            .addCase(fetchWorkflowInstanceDashboard.pending, (state) => {
                state.dashboardLoading = true;
            })
            .addCase(fetchWorkflowInstanceDashboard.fulfilled, (state, action) => {
                state.dashboardLoading = false;
                state.dashboard = action.payload;
            })
            .addCase(fetchWorkflowInstanceDashboard.rejected, (state) => {
                state.dashboardLoading = false;
            })
            .addCase(fetchWorkflowInstanceById.fulfilled, (state, action) => {
                const index = state.instances.findIndex((instance) => instance.id === action.payload.id);
                if (index >= 0) {
                    state.instances[index] = action.payload;
                } else {
                    state.instances = [...state.instances, action.payload];
                }
            });
    },
});

export default workflowInstancesSlice.reducer;
