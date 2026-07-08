import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, CHECKLIST_ENDPOINTS } from '../../../urlhelper';

// Matches ChecklistItemResponse on the backend.
export interface ChecklistItem {
    id: string;
    checklistId: string;
    itemText: string;
    required: boolean;
    orderNo: number;
}

// Matches ChecklistResponse on the backend. A standalone, reusable checklist — unlike a
// WorkFlowStageAction, it isn't owned by a single stage/transition; it's linked to
// whichever stages need it (see workflowLinks below).
export interface Checklist {
    id: string;
    name: string;
    description?: string;
    active: boolean;
    items: ChecklistItem[];
    totalItems: number;
    mandatoryItems: number;
    usedInStagesCount: number;
    createdAt: string;
    updatedAt: string;
}

// Matches ChecklistStageUsageResponse on the backend.
export interface ChecklistStageUsage {
    stageId: string;
    stageName: string;
    stageOrderNo: number;
    workFlowId: string;
    workFlowName: string;
}

// Matches ChecklistSummaryResponse on the backend — the chip shown against a stage on the Linking screen.
export interface ChecklistSummary {
    id: string;
    name: string;
    itemCount: number;
    mandatoryCount: number;
}

// Matches StageChecklistLinksResponse on the backend.
export interface StageChecklistLinks {
    stageId: string;
    stageName: string;
    orderNo: number;
    checklists: ChecklistSummary[];
}

// Matches WorkflowChecklistCoverageResponse on the backend.
export interface WorkflowChecklistCoverage {
    workFlowId: string;
    workFlowName: string;
    checklistCount: number;
    itemCount: number;
    mandatoryCount: number;
    optionalCount: number;
}

// Matches ChecklistAnalyticsResponse on the backend.
export interface ChecklistAnalytics {
    totalWorkflows: number;
    totalStages: number;
    totalChecklists: number;
    totalChecklistItems: number;
    totalMandatoryItems: number;
    perWorkflow: WorkflowChecklistCoverage[];
}

// Matches ChecklistRequest on the backend.
export interface ChecklistPayload {
    name: string;
    description?: string;
    active: boolean;
}

// Matches ChecklistItemRequest on the backend.
export interface ChecklistItemPayload {
    itemText: string;
    required: boolean;
    orderNo: number;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface ChecklistsState {
    checklists: Checklist[];
    loading: boolean;
    error: string | null;
    saving: boolean;

    usagesByChecklist: Record<string, ChecklistStageUsage[]>;
    usagesLoading: boolean;

    workflowLinks: StageChecklistLinks[];
    workflowLinksLoading: boolean;
    linking: boolean;

    analytics: ChecklistAnalytics | null;
    analyticsLoading: boolean;
}

const initialState: ChecklistsState = {
    checklists: [],
    loading: false,
    error: null,
    saving: false,

    usagesByChecklist: {},
    usagesLoading: false,

    workflowLinks: [],
    workflowLinksLoading: false,
    linking: false,

    analytics: null,
    analyticsLoading: false,
};

export const fetchChecklists = createAsyncThunk('checklists/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<Checklist[]>>(CHECKLIST_ENDPOINTS.ALL);
    return response.data;
});

export const fetchChecklistById = createAsyncThunk('checklists/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<Checklist>>(CHECKLIST_ENDPOINTS.BY_ID(id));
    return response.data;
});

export const createChecklist = createAsyncThunk('checklists/create', async (payload: ChecklistPayload) => {
    const response = await apiPost<BackendEnvelope<Checklist>>(CHECKLIST_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateChecklist = createAsyncThunk('checklists/update', async ({ id, payload }: { id: string; payload: ChecklistPayload }) => {
    const response = await apiPut<BackendEnvelope<Checklist>>(CHECKLIST_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteChecklist = createAsyncThunk('checklists/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(CHECKLIST_ENDPOINTS.DELETE(id));
    return id;
});

export const addChecklistItem = createAsyncThunk('checklists/addItem', async ({ checklistId, payload }: { checklistId: string; payload: ChecklistItemPayload }) => {
    const response = await apiPost<BackendEnvelope<Checklist>>(CHECKLIST_ENDPOINTS.ADD_ITEM(checklistId), payload);
    return response.data;
});

export const updateChecklistItem = createAsyncThunk(
    'checklists/updateItem',
    async ({ checklistId, itemId, payload }: { checklistId: string; itemId: string; payload: ChecklistItemPayload }) => {
        const response = await apiPut<BackendEnvelope<Checklist>>(CHECKLIST_ENDPOINTS.UPDATE_ITEM(checklistId, itemId), payload);
        return response.data;
    }
);

export const deleteChecklistItem = createAsyncThunk('checklists/deleteItem', async ({ checklistId, itemId }: { checklistId: string; itemId: string }) => {
    const response = await apiDelete<BackendEnvelope<Checklist>>(CHECKLIST_ENDPOINTS.DELETE_ITEM(checklistId, itemId));
    return response.data;
});

export const fetchChecklistUsages = createAsyncThunk('checklists/fetchUsages', async (checklistId: string) => {
    const response = await apiGet<BackendEnvelope<ChecklistStageUsage[]>>(CHECKLIST_ENDPOINTS.USAGES(checklistId));
    return { checklistId, usages: response.data };
});

export const linkChecklistToStage = createAsyncThunk('checklists/linkStage', async ({ checklistId, stageId }: { checklistId: string; stageId: string }) => {
    await apiPost<BackendEnvelope<null>>(CHECKLIST_ENDPOINTS.LINK_STAGE(checklistId, stageId));
    return { checklistId, stageId };
});

export const unlinkChecklistFromStage = createAsyncThunk('checklists/unlinkStage', async ({ checklistId, stageId }: { checklistId: string; stageId: string }) => {
    await apiDelete<BackendEnvelope<null>>(CHECKLIST_ENDPOINTS.UNLINK_STAGE(checklistId, stageId));
    return { checklistId, stageId };
});

export const fetchWorkflowChecklistLinks = createAsyncThunk('checklists/fetchWorkflowLinks', async (workFlowId: string) => {
    const response = await apiGet<BackendEnvelope<StageChecklistLinks[]>>(CHECKLIST_ENDPOINTS.WORKFLOW_LINKS(workFlowId));
    return response.data;
});

export const fetchChecklistAnalytics = createAsyncThunk('checklists/fetchAnalytics', async () => {
    const response = await apiGet<BackendEnvelope<ChecklistAnalytics>>(CHECKLIST_ENDPOINTS.ANALYTICS);
    return response.data;
});

const upsertChecklist = (state: ChecklistsState, checklist: Checklist) => {
    const index = state.checklists.findIndex((item) => item.id === checklist.id);
    if (index >= 0) {
        state.checklists[index] = checklist;
    } else {
        state.checklists = [...state.checklists, checklist];
    }
};

const checklistsSlice = createSlice({
    name: 'checklists',
    initialState,
    reducers: {
        clearChecklistsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChecklists.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchChecklists.fulfilled, (state, action) => {
                state.loading = false;
                state.checklists = action.payload;
            })
            .addCase(fetchChecklists.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load checklists';
            })
            .addCase(fetchChecklistById.fulfilled, (state, action) => {
                upsertChecklist(state, action.payload);
            })
            .addCase(createChecklist.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createChecklist.fulfilled, (state, action) => {
                state.saving = false;
                state.checklists = [...state.checklists, action.payload];
            })
            .addCase(createChecklist.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create checklist';
            })
            .addCase(updateChecklist.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateChecklist.fulfilled, (state, action) => {
                state.saving = false;
                upsertChecklist(state, action.payload);
            })
            .addCase(updateChecklist.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update checklist';
            })
            .addCase(deleteChecklist.fulfilled, (state, action) => {
                state.checklists = state.checklists.filter((checklist) => checklist.id !== action.payload);
                delete state.usagesByChecklist[action.payload];
            })
            .addCase(addChecklistItem.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(addChecklistItem.fulfilled, (state, action) => {
                state.saving = false;
                upsertChecklist(state, action.payload);
            })
            .addCase(addChecklistItem.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to add checklist item';
            })
            .addCase(updateChecklistItem.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateChecklistItem.fulfilled, (state, action) => {
                state.saving = false;
                upsertChecklist(state, action.payload);
            })
            .addCase(updateChecklistItem.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update checklist item';
            })
            .addCase(deleteChecklistItem.fulfilled, (state, action) => {
                upsertChecklist(state, action.payload);
            })
            .addCase(fetchChecklistUsages.pending, (state) => {
                state.usagesLoading = true;
            })
            .addCase(fetchChecklistUsages.fulfilled, (state, action) => {
                state.usagesLoading = false;
                state.usagesByChecklist[action.payload.checklistId] = action.payload.usages;
            })
            .addCase(fetchChecklistUsages.rejected, (state) => {
                state.usagesLoading = false;
            })
            .addCase(linkChecklistToStage.pending, (state) => {
                state.linking = true;
            })
            .addCase(linkChecklistToStage.fulfilled, (state) => {
                state.linking = false;
            })
            .addCase(linkChecklistToStage.rejected, (state, action) => {
                state.linking = false;
                state.error = action.error.message || 'Unable to link checklist to stage';
            })
            .addCase(unlinkChecklistFromStage.pending, (state) => {
                state.linking = true;
            })
            .addCase(unlinkChecklistFromStage.fulfilled, (state) => {
                state.linking = false;
            })
            .addCase(unlinkChecklistFromStage.rejected, (state, action) => {
                state.linking = false;
                state.error = action.error.message || 'Unable to unlink checklist from stage';
            })
            .addCase(fetchWorkflowChecklistLinks.pending, (state) => {
                state.workflowLinksLoading = true;
            })
            .addCase(fetchWorkflowChecklistLinks.fulfilled, (state, action) => {
                state.workflowLinksLoading = false;
                state.workflowLinks = action.payload;
            })
            .addCase(fetchWorkflowChecklistLinks.rejected, (state) => {
                state.workflowLinksLoading = false;
            })
            .addCase(fetchChecklistAnalytics.pending, (state) => {
                state.analyticsLoading = true;
            })
            .addCase(fetchChecklistAnalytics.fulfilled, (state, action) => {
                state.analyticsLoading = false;
                state.analytics = action.payload;
            })
            .addCase(fetchChecklistAnalytics.rejected, (state) => {
                state.analyticsLoading = false;
            });
    },
});

export const { clearChecklistsError } = checklistsSlice.actions;
export default checklistsSlice.reducer;
