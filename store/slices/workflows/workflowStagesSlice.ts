import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, WORKFLOW_STAGE_ENDPOINTS } from '../../../urlhelper';

export type StageResponsibleType = 'GROUP' | 'ROLE' | 'USERS' | 'ANY';

// Matches WorkFlowStageResponse on the backend.
export interface WorkflowStage {
    id: string;
    workFlowId: string;
    name: string;
    description?: string;
    orderNo: number;
    responsibleType: StageResponsibleType;
    responsibleGroupId?: string;
    responsibleGroupName?: string;
    responsibleRoleId?: string;
    responsibleRoleName?: string;
    responsibleUserIds?: string[];
    stateId: string;
    stateName?: string;
    defaultStatusId?: string;
    defaultStatusName?: string;
    isInitial: boolean;
    isFinal: boolean;
    interfaceKey?: string;
}

// Matches WorkFlowStageRequest on the backend.
export interface WorkflowStagePayload {
    workFlowId: string;
    name: string;
    description?: string;
    orderNo: number;
    responsibleType: StageResponsibleType;
    responsibleGroupId?: string;
    responsibleRoleId?: string;
    responsibleUserIds?: string[];
    stateId: string;
    defaultStatusId?: string;
    isInitial: boolean;
    isFinal: boolean;
    interfaceKey?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowStagesState {
    stages: WorkflowStage[];
    loading: boolean;
    error: string | null;
    saving: boolean;
}

const initialState: WorkflowStagesState = {
    stages: [],
    loading: false,
    error: null,
    saving: false,
};

const byOrder = (list: WorkflowStage[]) => [...list].sort((a, b) => a.orderNo - b.orderNo);

export const fetchWorkflowStages = createAsyncThunk('workflowStages/fetchAll', async (workFlowId: string) => {
    const response = await apiGet<BackendEnvelope<WorkflowStage[]>>(WORKFLOW_STAGE_ENDPOINTS.ALL(workFlowId));
    return response.data;
});

export const createWorkflowStage = createAsyncThunk('workflowStages/create', async (payload: WorkflowStagePayload) => {
    const response = await apiPost<BackendEnvelope<WorkflowStage>>(WORKFLOW_STAGE_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateWorkflowStage = createAsyncThunk('workflowStages/update', async ({ id, payload }: { id: string; payload: WorkflowStagePayload }) => {
    const response = await apiPut<BackendEnvelope<WorkflowStage>>(WORKFLOW_STAGE_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteWorkflowStage = createAsyncThunk('workflowStages/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(WORKFLOW_STAGE_ENDPOINTS.DELETE(id));
    return id;
});

const workflowStagesSlice = createSlice({
    name: 'workflowStages',
    initialState,
    reducers: {
        clearWorkflowStagesError(state) {
            state.error = null;
        },
        resetWorkflowStages(state) {
            state.stages = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowStages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowStages.fulfilled, (state, action) => {
                state.loading = false;
                state.stages = byOrder(action.payload);
            })
            .addCase(fetchWorkflowStages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load stages';
            })
            .addCase(createWorkflowStage.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createWorkflowStage.fulfilled, (state, action) => {
                state.saving = false;
                state.stages = byOrder([...state.stages, action.payload]);
            })
            .addCase(createWorkflowStage.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create stage';
            })
            .addCase(updateWorkflowStage.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateWorkflowStage.fulfilled, (state, action) => {
                state.saving = false;
                state.stages = byOrder(state.stages.map((stage) => (stage.id === action.payload.id ? action.payload : stage)));
            })
            .addCase(updateWorkflowStage.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update stage';
            })
            .addCase(deleteWorkflowStage.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteWorkflowStage.fulfilled, (state, action) => {
                state.saving = false;
                state.stages = state.stages.filter((stage) => stage.id !== action.payload);
            })
            .addCase(deleteWorkflowStage.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete stage';
            });
    },
});

export const { clearWorkflowStagesError, resetWorkflowStages } = workflowStagesSlice.actions;
export default workflowStagesSlice.reducer;
