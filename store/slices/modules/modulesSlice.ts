import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, MODULE_ENDPOINTS, MODULE_TYPE_ENDPOINTS } from '../../../urlhelper';

export interface ModuleNode {
    id: string;
    name: string;
    textId: string;
    description?: string;
    urlPath?: string;
    icon?: string;
    orderNo: number;
    moduleTypeId: string;
    parentId?: string;
    children: ModuleNode[];
}

export interface ModuleTreeGroup {
    moduleTypeId: string;
    moduleTypeName: string;
    orderNo: number;
    modules: ModuleNode[];
}

export interface ModuleType {
    id: string;
    name: string;
    textId: string;
    orderNo: number;
    description?: string;
}

// Matches ModuleRegisterRequest / ModuleTypeRequest on the backend.
export interface ModuleRegisterPayload {
    name: string;
    textId: string;
    description?: string;
    urlPath?: string;
    icon?: string;
    orderNo: number;
    moduleTypeId: string;
    parentId?: string;
}

export interface ModuleTypePayload {
    name: string;
    textId: string;
    orderNo: number;
    description?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface ModulesState {
    tree: ModuleTreeGroup[];
    treeLoading: boolean;
    treeLoaded: boolean;
    treeError: string | null;

    items: ModuleNode[];
    itemsLoading: boolean;
    itemsError: string | null;

    moduleTypes: ModuleType[];
    moduleTypesLoading: boolean;
    moduleTypesError: string | null;

    saving: boolean;
    error: string | null;
}

const initialState: ModulesState = {
    tree: [],
    treeLoading: false,
    treeLoaded: false,
    treeError: null,

    items: [],
    itemsLoading: false,
    itemsError: null,

    moduleTypes: [],
    moduleTypesLoading: false,
    moduleTypesError: null,

    saving: false,
    error: null,
};

const byOrderNo = <T extends { orderNo: number }>(list: T[]) => [...list].sort((a, b) => a.orderNo - b.orderNo);

// --- Sidebar tree (read-only, any authenticated user) ---------------------------------

export const fetchModuleTree = createAsyncThunk('modules/fetchTree', async () => {
    const response = await apiGet<BackendEnvelope<ModuleTreeGroup[]>>(MODULE_ENDPOINTS.MODULE_TREE);
    return response.data;
});

// --- Module CRUD (SYSTEM_ADMINISTRATOR only) -------------------------------------------

export const fetchModules = createAsyncThunk('modules/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<ModuleNode[]>>(MODULE_ENDPOINTS.ALL);
    return response.data;
});

export const fetchModuleById = createAsyncThunk('modules/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<ModuleNode>>(MODULE_ENDPOINTS.BY_ID(id));
    return response.data;
});

export const createModule = createAsyncThunk('modules/create', async (payload: ModuleRegisterPayload) => {
    const response = await apiPost<BackendEnvelope<ModuleNode>>(MODULE_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateModule = createAsyncThunk('modules/update', async ({ id, payload }: { id: string; payload: ModuleRegisterPayload }) => {
    const response = await apiPut<BackendEnvelope<ModuleNode>>(MODULE_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteModule = createAsyncThunk('modules/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(MODULE_ENDPOINTS.DELETE(id));
    return id;
});

// --- Module type CRUD (read is open; mutations are SYSTEM_ADMINISTRATOR only) ---------

export const fetchModuleTypes = createAsyncThunk('moduleTypes/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<ModuleType[]>>(MODULE_TYPE_ENDPOINTS.ALL);
    return response.data;
});

export const fetchModuleTypeById = createAsyncThunk('moduleTypes/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<ModuleType>>(MODULE_TYPE_ENDPOINTS.BY_ID(id));
    return response.data;
});

export const createModuleType = createAsyncThunk('moduleTypes/create', async (payload: ModuleTypePayload) => {
    const response = await apiPost<BackendEnvelope<ModuleType>>(MODULE_TYPE_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateModuleType = createAsyncThunk('moduleTypes/update', async ({ id, payload }: { id: string; payload: ModuleTypePayload }) => {
    const response = await apiPut<BackendEnvelope<ModuleType>>(MODULE_TYPE_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteModuleType = createAsyncThunk('moduleTypes/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(MODULE_TYPE_ENDPOINTS.DELETE(id));
    return id;
});

const modulesSlice = createSlice({
    name: 'modules',
    initialState,
    reducers: {
        clearModulesError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Sidebar tree
            .addCase(fetchModuleTree.pending, (state) => {
                state.treeLoading = true;
                state.treeError = null;
            })
            .addCase(fetchModuleTree.fulfilled, (state, action) => {
                state.treeLoading = false;
                state.treeLoaded = true;
                state.tree = byOrderNo(action.payload);
            })
            .addCase(fetchModuleTree.rejected, (state, action) => {
                state.treeLoading = false;
                state.treeLoaded = true;
                state.treeError = action.error.message || 'Unable to load the navigation menu';
            })

            // Module list
            .addCase(fetchModules.pending, (state) => {
                state.itemsLoading = true;
                state.itemsError = null;
            })
            .addCase(fetchModules.fulfilled, (state, action) => {
                state.itemsLoading = false;
                state.items = byOrderNo(action.payload);
            })
            .addCase(fetchModules.rejected, (state, action) => {
                state.itemsLoading = false;
                state.itemsError = action.error.message || 'Unable to load modules';
            })
            .addCase(fetchModuleById.fulfilled, (state, action) => {
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index >= 0) {
                    state.items[index] = action.payload;
                } else {
                    state.items = byOrderNo([...state.items, action.payload]);
                }
            })

            // Module mutations
            .addCase(createModule.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createModule.fulfilled, (state, action) => {
                state.saving = false;
                state.items = byOrderNo([...state.items, action.payload]);
            })
            .addCase(createModule.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create module';
            })
            .addCase(updateModule.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateModule.fulfilled, (state, action) => {
                state.saving = false;
                state.items = byOrderNo(state.items.map((item) => (item.id === action.payload.id ? action.payload : item)));
            })
            .addCase(updateModule.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update module';
            })
            .addCase(deleteModule.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteModule.fulfilled, (state, action) => {
                state.saving = false;
                state.items = state.items.filter((item) => item.id !== action.payload);
            })
            .addCase(deleteModule.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete module';
            })

            // Module type list
            .addCase(fetchModuleTypes.pending, (state) => {
                state.moduleTypesLoading = true;
                state.moduleTypesError = null;
            })
            .addCase(fetchModuleTypes.fulfilled, (state, action) => {
                state.moduleTypesLoading = false;
                state.moduleTypes = byOrderNo(action.payload);
            })
            .addCase(fetchModuleTypes.rejected, (state, action) => {
                state.moduleTypesLoading = false;
                state.moduleTypesError = action.error.message || 'Unable to load module types';
            })
            .addCase(fetchModuleTypeById.fulfilled, (state, action) => {
                const index = state.moduleTypes.findIndex((item) => item.id === action.payload.id);
                if (index >= 0) {
                    state.moduleTypes[index] = action.payload;
                } else {
                    state.moduleTypes = byOrderNo([...state.moduleTypes, action.payload]);
                }
            })

            // Module type mutations
            .addCase(createModuleType.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createModuleType.fulfilled, (state, action) => {
                state.saving = false;
                state.moduleTypes = byOrderNo([...state.moduleTypes, action.payload]);
            })
            .addCase(createModuleType.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create module type';
            })
            .addCase(updateModuleType.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateModuleType.fulfilled, (state, action) => {
                state.saving = false;
                state.moduleTypes = byOrderNo(state.moduleTypes.map((item) => (item.id === action.payload.id ? action.payload : item)));
            })
            .addCase(updateModuleType.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update module type';
            })
            .addCase(deleteModuleType.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteModuleType.fulfilled, (state, action) => {
                state.saving = false;
                state.moduleTypes = state.moduleTypes.filter((item) => item.id !== action.payload);
            })
            .addCase(deleteModuleType.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete module type';
            });
    },
});

export const { clearModulesError } = modulesSlice.actions;
export default modulesSlice.reducer;
