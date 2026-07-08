import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiPost, WORKFLOW_INSTANCE_ENDPOINTS } from '../../../urlhelper';
import type { WorkflowAvailableTransition } from '@/pages/pages/interfaceRegistry';

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
    currentStageInterfaceKey?: string;
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

// Matches TransitionWorkFlowRequest on the backend.
export interface TransitionInstancePayload {
    transitionId: string;
    comment?: string;
    completedChecklistItemIds?: string[];
    dataChanges?: Record<string, unknown>;
}

// Matches ReassignWorkFlowInstanceRequest on the backend.
export interface ReassignInstancePayload {
    assignedToUserId: string;
    comment?: string;
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

    inTray: WorkflowInstance[];
    inTrayLoading: boolean;
    inTrayError: string | null;

    availableTransitionsByInstance: Record<string, WorkflowAvailableTransition[]>;
    acting: boolean;
}

const initialState: WorkflowInstancesState = {
    instances: [],
    loading: false,
    error: null,
    dashboard: null,
    dashboardLoading: false,

    inTray: [],
    inTrayLoading: false,
    inTrayError: null,

    availableTransitionsByInstance: {},
    acting: false,
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

export const fetchWorkflowInTray = createAsyncThunk('workflowInstances/fetchInTray', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowInstance[]>>(WORKFLOW_INSTANCE_ENDPOINTS.IN_TRAY);
    return response.data;
});

export const fetchAvailableTransitions = createAsyncThunk('workflowInstances/fetchAvailableTransitions', async (instanceId: string) => {
    const response = await apiGet<BackendEnvelope<WorkflowAvailableTransition[]>>(WORKFLOW_INSTANCE_ENDPOINTS.AVAILABLE_TRANSITIONS(instanceId));
    return { instanceId, transitions: response.data };
});

export const transitionWorkflowInstance = createAsyncThunk(
    'workflowInstances/transition',
    async ({ id, payload }: { id: string; payload: TransitionInstancePayload }) => {
        const response = await apiPost<BackendEnvelope<WorkflowInstance>>(WORKFLOW_INSTANCE_ENDPOINTS.TRANSITION(id), payload);
        return response.data;
    }
);

export const reassignWorkflowInstance = createAsyncThunk(
    'workflowInstances/reassign',
    async ({ id, payload }: { id: string; payload: ReassignInstancePayload }) => {
        const response = await apiPost<BackendEnvelope<WorkflowInstance>>(WORKFLOW_INSTANCE_ENDPOINTS.REASSIGN(id), payload);
        return response.data;
    }
);

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
            })
            .addCase(fetchWorkflowInTray.pending, (state) => {
                state.inTrayLoading = true;
                state.inTrayError = null;
            })
            .addCase(fetchWorkflowInTray.fulfilled, (state, action) => {
                state.inTrayLoading = false;
                state.inTray = action.payload;
            })
            .addCase(fetchWorkflowInTray.rejected, (state, action) => {
                state.inTrayLoading = false;
                state.inTrayError = action.error.message || 'Unable to load in-tray';
            })
            .addCase(fetchAvailableTransitions.fulfilled, (state, action) => {
                state.availableTransitionsByInstance[action.payload.instanceId] = action.payload.transitions;
            })
            .addCase(transitionWorkflowInstance.pending, (state) => {
                state.acting = true;
            })
            .addCase(transitionWorkflowInstance.fulfilled, (state) => {
                state.acting = false;
            })
            .addCase(transitionWorkflowInstance.rejected, (state) => {
                state.acting = false;
            })
            .addCase(reassignWorkflowInstance.pending, (state) => {
                state.acting = true;
            })
            .addCase(reassignWorkflowInstance.fulfilled, (state) => {
                state.acting = false;
            })
            .addCase(reassignWorkflowInstance.rejected, (state) => {
                state.acting = false;
            });
    },
});

export default workflowInstancesSlice.reducer;
