import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, WORKFLOW_STAGE_ACTION_ENDPOINTS } from '../../../urlhelper';

// Matches WorkFlowStageActionChecklistResponse / Request on the backend.
export interface WorkflowStageActionChecklistItem {
    itemText: string;
    required: boolean;
    orderNo: number;
}

// Matches WorkFlowStageActionResponse on the backend.
export interface WorkflowStageAction {
    id: string;
    stageId: string;
    transitionId: string;
    transitionName: string;
    name: string;
    requiresChecklistCompletion: boolean;
    requiresApprovalComment: boolean;
    active: boolean;
    checklistItems: WorkflowStageActionChecklistItem[];
}

// Matches WorkFlowStageActionRequest on the backend.
export interface WorkflowStageActionPayload {
    stageId: string;
    transitionId: string;
    name: string;
    requiresChecklistCompletion: boolean;
    requiresApprovalComment: boolean;
    active: boolean;
    checklistItems: WorkflowStageActionChecklistItem[];
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowStageActionsState {
    actions: WorkflowStageAction[];
    loading: boolean;
    error: string | null;
    saving: boolean;
}

const initialState: WorkflowStageActionsState = {
    actions: [],
    loading: false,
    error: null,
    saving: false,
};

export const fetchWorkflowStageActions = createAsyncThunk('workflowStageActions/fetchAll', async (stageId: string) => {
    const response = await apiGet<BackendEnvelope<WorkflowStageAction[]>>(WORKFLOW_STAGE_ACTION_ENDPOINTS.ALL(stageId));
    return response.data;
});

export const createWorkflowStageAction = createAsyncThunk('workflowStageActions/create', async (payload: WorkflowStageActionPayload) => {
    const response = await apiPost<BackendEnvelope<WorkflowStageAction>>(WORKFLOW_STAGE_ACTION_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateWorkflowStageAction = createAsyncThunk(
    'workflowStageActions/update',
    async ({ id, payload }: { id: string; payload: WorkflowStageActionPayload }) => {
        const response = await apiPut<BackendEnvelope<WorkflowStageAction>>(WORKFLOW_STAGE_ACTION_ENDPOINTS.UPDATE(id), payload);
        return response.data;
    }
);

export const deleteWorkflowStageAction = createAsyncThunk('workflowStageActions/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(WORKFLOW_STAGE_ACTION_ENDPOINTS.DELETE(id));
    return id;
});

const workflowStageActionsSlice = createSlice({
    name: 'workflowStageActions',
    initialState,
    reducers: {
        clearWorkflowStageActionsError(state) {
            state.error = null;
        },
        resetWorkflowStageActions(state) {
            state.actions = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowStageActions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowStageActions.fulfilled, (state, action) => {
                state.loading = false;
                state.actions = action.payload;
            })
            .addCase(fetchWorkflowStageActions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load stage actions';
            })
            .addCase(createWorkflowStageAction.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createWorkflowStageAction.fulfilled, (state, action) => {
                state.saving = false;
                state.actions = [...state.actions, action.payload];
            })
            .addCase(createWorkflowStageAction.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create stage action';
            })
            .addCase(updateWorkflowStageAction.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateWorkflowStageAction.fulfilled, (state, action) => {
                state.saving = false;
                state.actions = state.actions.map((item) => (item.id === action.payload.id ? action.payload : item));
            })
            .addCase(updateWorkflowStageAction.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update stage action';
            })
            .addCase(deleteWorkflowStageAction.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteWorkflowStageAction.fulfilled, (state, action) => {
                state.saving = false;
                state.actions = state.actions.filter((item) => item.id !== action.payload);
            })
            .addCase(deleteWorkflowStageAction.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete stage action';
            });
    },
});

export const { clearWorkflowStageActionsError, resetWorkflowStageActions } = workflowStageActionsSlice.actions;
export default workflowStageActionsSlice.reducer;
