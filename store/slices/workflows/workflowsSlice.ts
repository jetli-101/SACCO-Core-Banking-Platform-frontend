import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, WORKFLOW_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowResponse on the backend.
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    active: boolean;
    createdByUserId?: string;
    createdByName?: string;
    totalStages: number;
    initialStageId?: string;
    initialStageName?: string;
    createdAt: string;
    updatedAt: string;
    // Roles (beyond ROLE_SYSTEM_ADMINISTRATOR, which always has full access) allowed to
    // view/configure this specific workflow. Empty means admin-only.
    allowedRoleIds?: string[];
    allowedRoleNames?: string[];
}

// Matches WorkFlowRequest on the backend.
export interface WorkflowPayload {
    name: string;
    description?: string;
    active: boolean;
    allowedRoleIds?: string[];
}

// Matches WorkFlowDashboardResponse on the backend — backs the stat cards on the Workflows list screen.
export interface WorkflowDashboard {
    totalWorkFlows: number;
    activeWorkFlows: number;
    activeProcesses: number;
    averageStages: number;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowsState {
    workflows: Workflow[];
    workflowsLoading: boolean;
    workflowsError: string | null;
    dashboard: WorkflowDashboard | null;
    dashboardLoading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: WorkflowsState = {
    workflows: [],
    workflowsLoading: false,
    workflowsError: null,
    dashboard: null,
    dashboardLoading: false,
    saving: false,
    error: null,
};

const byName = (list: Workflow[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

export const fetchWorkflows = createAsyncThunk('workflows/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<Workflow[]>>(WORKFLOW_ENDPOINTS.ALL);
    return response.data;
});

export const fetchWorkflowDashboard = createAsyncThunk('workflows/fetchDashboard', async () => {
    const response = await apiGet<BackendEnvelope<WorkflowDashboard>>(WORKFLOW_ENDPOINTS.DASHBOARD);
    return response.data;
});

export const fetchWorkflowById = createAsyncThunk('workflows/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<Workflow>>(WORKFLOW_ENDPOINTS.BY_ID(id));
    return response.data;
});

export const createWorkflow = createAsyncThunk('workflows/create', async (payload: WorkflowPayload) => {
    const response = await apiPost<BackendEnvelope<Workflow>>(WORKFLOW_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateWorkflow = createAsyncThunk('workflows/update', async ({ id, payload }: { id: string; payload: WorkflowPayload }) => {
    const response = await apiPut<BackendEnvelope<Workflow>>(WORKFLOW_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteWorkflow = createAsyncThunk('workflows/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(WORKFLOW_ENDPOINTS.DELETE(id));
    return id;
});

const workflowsSlice = createSlice({
    name: 'workflows',
    initialState,
    reducers: {
        clearWorkflowsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflows.pending, (state) => {
                state.workflowsLoading = true;
                state.workflowsError = null;
            })
            .addCase(fetchWorkflows.fulfilled, (state, action) => {
                state.workflowsLoading = false;
                state.workflows = byName(action.payload);
            })
            .addCase(fetchWorkflows.rejected, (state, action) => {
                state.workflowsLoading = false;
                state.workflowsError = action.error.message || 'Unable to load workflows';
            })
            .addCase(fetchWorkflowDashboard.pending, (state) => {
                state.dashboardLoading = true;
            })
            .addCase(fetchWorkflowDashboard.fulfilled, (state, action) => {
                state.dashboardLoading = false;
                state.dashboard = action.payload;
            })
            .addCase(fetchWorkflowDashboard.rejected, (state) => {
                state.dashboardLoading = false;
            })
            .addCase(fetchWorkflowById.fulfilled, (state, action) => {
                const index = state.workflows.findIndex((workflow) => workflow.id === action.payload.id);
                if (index >= 0) {
                    state.workflows[index] = action.payload;
                } else {
                    state.workflows = byName([...state.workflows, action.payload]);
                }
            })
            .addCase(createWorkflow.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createWorkflow.fulfilled, (state, action) => {
                state.saving = false;
                state.workflows = byName([...state.workflows, action.payload]);
            })
            .addCase(createWorkflow.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create workflow';
            })
            .addCase(updateWorkflow.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateWorkflow.fulfilled, (state, action) => {
                state.saving = false;
                state.workflows = byName(state.workflows.map((workflow) => (workflow.id === action.payload.id ? action.payload : workflow)));
            })
            .addCase(updateWorkflow.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update workflow';
            })
            .addCase(deleteWorkflow.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteWorkflow.fulfilled, (state, action) => {
                state.saving = false;
                state.workflows = state.workflows.filter((workflow) => workflow.id !== action.payload);
            })
            .addCase(deleteWorkflow.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete workflow';
            });
    },
});

export const { clearWorkflowsError } = workflowsSlice.actions;
export default workflowsSlice.reducer;
