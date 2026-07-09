import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, ROLE_ENDPOINTS, MODULE_ENDPOINTS } from '../../../urlhelper';
import { ModuleNode } from '../modules/modulesSlice';
import { GroupMember } from '../common/types';

export interface Role {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
}

// Matches RoleRequest on the backend.
export interface RolePayload {
    name: string;
    description?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface RolesState {
    roles: Role[];
    rolesLoading: boolean;
    rolesError: string | null;
    members: GroupMember[];
    membersLoading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: RolesState = {
    roles: [],
    rolesLoading: false,
    rolesError: null,
    members: [],
    membersLoading: false,
    saving: false,
    error: null,
};

const byName = (list: Role[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

// Role groups double as the "user groups" that gate which modules show up in a member's
// sidebar — Role.modules on the backend is the same many-to-many a SYSTEM_ADMINISTRATOR
// manages here, just owned from the role side instead of the module side.
export const fetchRoles = createAsyncThunk('roles/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<Role[]>>(ROLE_ENDPOINTS.ALL);
    return response.data;
});

export const fetchRoleById = createAsyncThunk('roles/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<Role>>(ROLE_ENDPOINTS.BY_ID(id));
    return response.data;
});

export const createRole = createAsyncThunk('roles/create', async (payload: RolePayload) => {
    const response = await apiPost<BackendEnvelope<Role>>(ROLE_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateRole = createAsyncThunk('roles/update', async ({ id, payload }: { id: string; payload: RolePayload }) => {
    const response = await apiPut<BackendEnvelope<Role>>(ROLE_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteRole = createAsyncThunk('roles/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(ROLE_ENDPOINTS.DELETE(id));
    return id;
});

// Modules a given role currently has in its menu — used to pre-populate the "Manage
// Modules" picker for an existing role.
export const fetchRoleModules = createAsyncThunk('roles/fetchModules', async (roleId: string) => {
    const response = await apiGet<BackendEnvelope<ModuleNode[]>>(ROLE_ENDPOINTS.MODULES(roleId));
    return response.data;
});

export const grantModulesToRole = createAsyncThunk('roles/grantModules', async ({ roleId, moduleIds }: { roleId: string; moduleIds: string[] }) => {
    await apiPost(ROLE_ENDPOINTS.MODULES(roleId), moduleIds);
});

export const revokeModulesFromRole = createAsyncThunk('roles/revokeModules', async ({ roleId, moduleIds }: { roleId: string; moduleIds: string[] }) => {
    await apiDelete(ROLE_ENDPOINTS.MODULES(roleId), moduleIds);
});

export const fetchRoleMembers = createAsyncThunk('roles/fetchMembers', async (roleId: string) => {
    const response = await apiGet<BackendEnvelope<GroupMember[]>>(ROLE_ENDPOINTS.MEMBERS(roleId));
    return response.data;
});

export const addRoleMember = createAsyncThunk('roles/addMember', async ({ roleId, userId }: { roleId: string; userId: string }) => {
    const response = await apiPost<BackendEnvelope<GroupMember>>(ROLE_ENDPOINTS.MEMBERS(roleId), { userId });
    return response.data;
});

export const removeRoleMember = createAsyncThunk('roles/removeMember', async ({ roleId, userId }: { roleId: string; userId: string }) => {
    await apiDelete(ROLE_ENDPOINTS.REMOVE_MEMBER(roleId, userId));
    return userId;
});

const rolesSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {
        clearRolesError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => {
                state.rolesLoading = true;
                state.rolesError = null;
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.rolesLoading = false;
                state.roles = byName(action.payload);
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.rolesLoading = false;
                state.rolesError = action.error.message || 'Unable to load roles';
            })
            .addCase(fetchRoleById.fulfilled, (state, action) => {
                const index = state.roles.findIndex((role) => role.id === action.payload.id);
                if (index >= 0) {
                    state.roles[index] = action.payload;
                } else {
                    state.roles = byName([...state.roles, action.payload]);
                }
            })
            .addCase(createRole.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createRole.fulfilled, (state, action) => {
                state.saving = false;
                state.roles = byName([...state.roles, action.payload]);
            })
            .addCase(createRole.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create role';
            })
            .addCase(updateRole.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateRole.fulfilled, (state, action) => {
                state.saving = false;
                state.roles = byName(state.roles.map((role) => (role.id === action.payload.id ? action.payload : role)));
            })
            .addCase(updateRole.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update role';
            })
            .addCase(deleteRole.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteRole.fulfilled, (state, action) => {
                state.saving = false;
                state.roles = state.roles.filter((role) => role.id !== action.payload);
            })
            .addCase(deleteRole.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete role';
            })
            .addCase(grantModulesToRole.pending, (state) => {
                state.saving = true;
            })
            .addCase(grantModulesToRole.fulfilled, (state) => {
                state.saving = false;
            })
            .addCase(grantModulesToRole.rejected, (state) => {
                state.saving = false;
            })
            .addCase(revokeModulesFromRole.pending, (state) => {
                state.saving = true;
            })
            .addCase(revokeModulesFromRole.fulfilled, (state) => {
                state.saving = false;
            })
            .addCase(revokeModulesFromRole.rejected, (state) => {
                state.saving = false;
            })
            .addCase(fetchRoleMembers.pending, (state) => {
                state.membersLoading = true;
            })
            .addCase(fetchRoleMembers.fulfilled, (state, action) => {
                state.membersLoading = false;
                state.members = action.payload;
            })
            .addCase(fetchRoleMembers.rejected, (state, action) => {
                state.membersLoading = false;
                state.error = action.error.message || 'Unable to load members';
            })
            .addCase(addRoleMember.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(addRoleMember.fulfilled, (state, action) => {
                state.saving = false;
                state.members = [...state.members, action.payload];
            })
            .addCase(addRoleMember.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to assign member';
            })
            .addCase(removeRoleMember.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(removeRoleMember.fulfilled, (state, action) => {
                state.saving = false;
                state.members = state.members.filter((member) => member.userId !== action.payload);
            })
            .addCase(removeRoleMember.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to remove member';
            });
    },
});

export const { clearRolesError } = rolesSlice.actions;
export default rolesSlice.reducer;
