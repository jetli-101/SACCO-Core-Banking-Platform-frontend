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
    items: ModuleNode[];
    itemsLoading: boolean;
    itemsError: string | null;

    // Permission-aware sidebar menu for the current user (GET /modules/module-tree)
    menuGroups: ModuleTreeGroup[];
    menuLoading: boolean;
    menuError: string | null;

    moduleTypes: ModuleType[];
    moduleTypesLoading: boolean;
    moduleTypesError: string | null;

    saving: boolean;
    error: string | null;
}

const initialState: ModulesState = {
    items: [],
    itemsLoading: false,
    itemsError: null,

    menuGroups: [],
    menuLoading: false,
    menuError: null,

    moduleTypes: [],
    moduleTypesLoading: false,
    moduleTypesError: null,

    saving: false,
    error: null,
};

const byOrderNo = <T extends { orderNo: number }>(list: T[]) => [...list].sort((a, b) => a.orderNo - b.orderNo);

// /modules/all nests a module's children inline (e.g. "Module Management" arrives with
// children: [{ name: "Modules", parentId: "<Module Management's id>" }]) rather than also
// duplicating them as separate top-level entries. Both the sidebar tree and the Modules
// admin table need every module — nested or not — in one flat list keyed by id, with
// parentId as the only relationship they trust (reliable at every depth, unlike .children
// which is only populated on whichever copy the API returned it on).
export const flattenModules = (items: ModuleNode[]): Map<string, ModuleNode> => {
    const flat = new Map<string, ModuleNode>();
    const collect = (list: ModuleNode[]) => {
        list.forEach((module) => {
            if (!flat.has(module.id)) flat.set(module.id, { ...module, children: [] });
            if (module.children?.length) collect(module.children);
        });
    };
    collect(items);
    return flat;
};

// Builds the sidebar's grouped tree from /modules/all, rebuilding parent -> children
// purely from parentId across the fully-flattened module set (see flattenModules above).
export const buildModuleTree = (items: ModuleNode[], moduleTypes: ModuleType[]): ModuleTreeGroup[] => {
    const flat = flattenModules(items);

    flat.forEach((module) => {
        const parent = module.parentId && module.parentId !== module.id ? flat.get(module.parentId) : undefined;
        if (parent) parent.children.push(module);
    });

    const sortTree = (list: ModuleNode[]): ModuleNode[] => byOrderNo(list).map((module) => ({ ...module, children: sortTree(module.children) }));

    const topLevelByType = new Map<string, ModuleNode[]>();
    flat.forEach((module) => {
        const isTopLevel = !module.parentId || !flat.has(module.parentId);
        if (isTopLevel) {
            const list = topLevelByType.get(module.moduleTypeId) || [];
            list.push(module);
            topLevelByType.set(module.moduleTypeId, list);
        }
    });

    const matchedTypeIds = new Set(moduleTypes.map((type) => type.id));
    const groups: ModuleTreeGroup[] = byOrderNo(moduleTypes).map((type) => ({
        moduleTypeId: type.id,
        moduleTypeName: type.name,
        orderNo: type.orderNo,
        modules: sortTree(topLevelByType.get(type.id) || []),
    }));

    const otherTopLevel: ModuleNode[] = [];
    topLevelByType.forEach((list, typeId) => {
        if (!matchedTypeIds.has(typeId)) otherTopLevel.push(...list);
    });
    if (otherTopLevel.length) {
        groups.push({ moduleTypeId: '__other__', moduleTypeName: 'Other', orderNo: Number.MAX_SAFE_INTEGER, modules: sortTree(otherTopLevel) });
    }

    return groups.filter((group) => group.modules.length > 0);
};

// --- Module CRUD (SYSTEM_ADMINISTRATOR only) -------------------------------------------

export const fetchModules = createAsyncThunk('modules/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<ModuleNode[]>>(MODULE_ENDPOINTS.ALL);
    return response.data;
});

// Permission-aware sidebar menu — visible to every authenticated user.
// Returns only the modules the current user is entitled to see (unrestricted +
// explicitly granted via their roles/groups), grouped by module type.
export const fetchMyMenu = createAsyncThunk('modules/fetchMyMenu', async () => {
    const response = await apiGet<BackendEnvelope<ModuleTreeGroup[]>>(MODULE_ENDPOINTS.MY_MENU);
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

            // Sidebar menu tree (permission-aware)
            .addCase(fetchMyMenu.pending, (state) => {
                state.menuLoading = true;
                state.menuError = null;
            })
            .addCase(fetchMyMenu.fulfilled, (state, action) => {
                state.menuLoading = false;
                state.menuGroups = action.payload;
            })
            .addCase(fetchMyMenu.rejected, (state, action) => {
                state.menuLoading = false;
                state.menuError = action.error.message || 'Unable to load menu';
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
