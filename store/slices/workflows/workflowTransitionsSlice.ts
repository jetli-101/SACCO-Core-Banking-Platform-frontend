import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, WORKFLOW_TRANSITION_ENDPOINTS } from '../../../urlhelper';

export type TransitionActionType = 'NORMAL_SUBMISSION' | 'APPROVAL' | 'REJECTION' | 'RETURN';

// Matches WorkFlowTransitionResponse on the backend.
export interface WorkflowTransition {
    id: string;
    workFlowId: string;
    fromStageId: string;
    fromStageName: string;
    toStageId: string;
    toStageName: string;
    name: string;
    actionType: TransitionActionType;
    resultingStatusId?: string;
    resultingStatusName?: string;
    description?: string;
    active: boolean;
}

// Matches WorkFlowTransitionRequest on the backend.
export interface WorkflowTransitionPayload {
    workFlowId: string;
    fromStageId: string;
    toStageId: string;
    name: string;
    actionType: TransitionActionType;
    resultingStatusId?: string;
    description?: string;
    active: boolean;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface WorkflowTransitionsState {
    transitions: WorkflowTransition[];
    loading: boolean;
    error: string | null;
    saving: boolean;
}

const initialState: WorkflowTransitionsState = {
    transitions: [],
    loading: false,
    error: null,
    saving: false,
};

export const fetchWorkflowTransitions = createAsyncThunk('workflowTransitions/fetchAll', async (workFlowId: string) => {
    const response = await apiGet<BackendEnvelope<WorkflowTransition[]>>(WORKFLOW_TRANSITION_ENDPOINTS.ALL(workFlowId));
    return response.data;
});

export const createWorkflowTransition = createAsyncThunk('workflowTransitions/create', async (payload: WorkflowTransitionPayload) => {
    const response = await apiPost<BackendEnvelope<WorkflowTransition>>(WORKFLOW_TRANSITION_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateWorkflowTransition = createAsyncThunk('workflowTransitions/update', async ({ id, payload }: { id: string; payload: WorkflowTransitionPayload }) => {
    const response = await apiPut<BackendEnvelope<WorkflowTransition>>(WORKFLOW_TRANSITION_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteWorkflowTransition = createAsyncThunk('workflowTransitions/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(WORKFLOW_TRANSITION_ENDPOINTS.DELETE(id));
    return id;
});

const workflowTransitionsSlice = createSlice({
    name: 'workflowTransitions',
    initialState,
    reducers: {
        clearWorkflowTransitionsError(state) {
            state.error = null;
        },
        resetWorkflowTransitions(state) {
            state.transitions = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflowTransitions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflowTransitions.fulfilled, (state, action) => {
                state.loading = false;
                state.transitions = action.payload;
            })
            .addCase(fetchWorkflowTransitions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load transitions';
            })
            .addCase(createWorkflowTransition.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createWorkflowTransition.fulfilled, (state, action) => {
                state.saving = false;
                state.transitions = [...state.transitions, action.payload];
            })
            .addCase(createWorkflowTransition.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create transition';
            })
            .addCase(updateWorkflowTransition.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateWorkflowTransition.fulfilled, (state, action) => {
                state.saving = false;
                state.transitions = state.transitions.map((transition) => (transition.id === action.payload.id ? action.payload : transition));
            })
            .addCase(updateWorkflowTransition.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update transition';
            })
            .addCase(deleteWorkflowTransition.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteWorkflowTransition.fulfilled, (state, action) => {
                state.saving = false;
                state.transitions = state.transitions.filter((transition) => transition.id !== action.payload);
            })
            .addCase(deleteWorkflowTransition.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete transition';
            });
    },
});

export const { clearWorkflowTransitionsError, resetWorkflowTransitions } = workflowTransitionsSlice.actions;
export default workflowTransitionsSlice.reducer;
