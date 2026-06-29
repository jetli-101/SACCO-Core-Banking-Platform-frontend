import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiDelete, apiGet, apiPost, apiPut, USER_GROUP_ENDPOINTS } from '../../../urlhelper';
import { GroupMember } from '../common/types';

export interface UserGroup {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
}

// Matches UserGroupRequest on the backend.
export interface UserGroupPayload {
    name: string;
    description?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface UserGroupsState {
    groups: UserGroup[];
    groupsLoading: boolean;
    groupsError: string | null;
    members: GroupMember[];
    membersLoading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: UserGroupsState = {
    groups: [],
    groupsLoading: false,
    groupsError: null,
    members: [],
    membersLoading: false,
    saving: false,
    error: null,
};

const byName = (list: UserGroup[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

// UserGroups are a second, independent way (alongside Role) to grant module access — a
// module shows up in a member's sidebar if either their Role or any of their UserGroups
// grants it. See ModuleRegisterService.getMyMenu on the backend.
export const fetchUserGroups = createAsyncThunk('userGroups/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<UserGroup[]>>(USER_GROUP_ENDPOINTS.ALL);
    return response.data;
});

export const fetchUserGroupById = createAsyncThunk('userGroups/fetchById', async (id: string) => {
    const response = await apiGet<BackendEnvelope<UserGroup>>(USER_GROUP_ENDPOINTS.BY_ID(id));
    return response.data;
});

export const createUserGroup = createAsyncThunk('userGroups/create', async (payload: UserGroupPayload) => {
    const response = await apiPost<BackendEnvelope<UserGroup>>(USER_GROUP_ENDPOINTS.CREATE, payload);
    return response.data;
});

export const updateUserGroup = createAsyncThunk('userGroups/update', async ({ id, payload }: { id: string; payload: UserGroupPayload }) => {
    const response = await apiPut<BackendEnvelope<UserGroup>>(USER_GROUP_ENDPOINTS.UPDATE(id), payload);
    return response.data;
});

export const deleteUserGroup = createAsyncThunk('userGroups/delete', async (id: string) => {
    await apiDelete<BackendEnvelope<null>>(USER_GROUP_ENDPOINTS.DELETE(id));
    return id;
});

export const grantModulesToGroup = createAsyncThunk('userGroups/grantModules', async ({ groupId, moduleIds }: { groupId: string; moduleIds: string[] }) => {
    await apiPost(USER_GROUP_ENDPOINTS.MODULES(groupId), moduleIds);
});

export const revokeModulesFromGroup = createAsyncThunk('userGroups/revokeModules', async ({ groupId, moduleIds }: { groupId: string; moduleIds: string[] }) => {
    await apiDelete(USER_GROUP_ENDPOINTS.MODULES(groupId), moduleIds);
});

export const fetchGroupModules = createAsyncThunk('userGroups/fetchModules', async (groupId: string) => {
    const response = await apiGet<BackendEnvelope<{ id: string }[]>>(USER_GROUP_ENDPOINTS.MODULES(groupId));
    return response.data;
});

export const fetchGroupMembers = createAsyncThunk('userGroups/fetchMembers', async (groupId: string) => {
    const response = await apiGet<BackendEnvelope<GroupMember[]>>(USER_GROUP_ENDPOINTS.MEMBERS(groupId));
    return response.data;
});

export const addGroupMember = createAsyncThunk('userGroups/addMember', async ({ groupId, userId }: { groupId: string; userId: string }) => {
    const response = await apiPost<BackendEnvelope<GroupMember>>(USER_GROUP_ENDPOINTS.MEMBERS(groupId), { userId });
    return response.data;
});

export const removeGroupMember = createAsyncThunk('userGroups/removeMember', async ({ groupId, userId }: { groupId: string; userId: string }) => {
    await apiDelete(USER_GROUP_ENDPOINTS.REMOVE_MEMBER(groupId, userId));
    return userId;
});

const userGroupsSlice = createSlice({
    name: 'userGroups',
    initialState,
    reducers: {
        clearUserGroupsError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserGroups.pending, (state) => {
                state.groupsLoading = true;
                state.groupsError = null;
            })
            .addCase(fetchUserGroups.fulfilled, (state, action) => {
                state.groupsLoading = false;
                state.groups = byName(action.payload);
            })
            .addCase(fetchUserGroups.rejected, (state, action) => {
                state.groupsLoading = false;
                state.groupsError = action.error.message || 'Unable to load user groups';
            })
            .addCase(fetchUserGroupById.fulfilled, (state, action) => {
                const index = state.groups.findIndex((group) => group.id === action.payload.id);
                if (index >= 0) {
                    state.groups[index] = action.payload;
                } else {
                    state.groups = byName([...state.groups, action.payload]);
                }
            })
            .addCase(createUserGroup.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createUserGroup.fulfilled, (state, action) => {
                state.saving = false;
                state.groups = byName([...state.groups, action.payload]);
            })
            .addCase(createUserGroup.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to create user group';
            })
            .addCase(updateUserGroup.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateUserGroup.fulfilled, (state, action) => {
                state.saving = false;
                state.groups = byName(state.groups.map((group) => (group.id === action.payload.id ? action.payload : group)));
            })
            .addCase(updateUserGroup.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update user group';
            })
            .addCase(deleteUserGroup.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteUserGroup.fulfilled, (state, action) => {
                state.saving = false;
                state.groups = state.groups.filter((group) => group.id !== action.payload);
            })
            .addCase(deleteUserGroup.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to delete user group';
            })
            .addCase(grantModulesToGroup.pending, (state) => {
                state.saving = true;
            })
            .addCase(grantModulesToGroup.fulfilled, (state) => {
                state.saving = false;
            })
            .addCase(grantModulesToGroup.rejected, (state) => {
                state.saving = false;
            })
            .addCase(revokeModulesFromGroup.pending, (state) => {
                state.saving = true;
            })
            .addCase(revokeModulesFromGroup.fulfilled, (state) => {
                state.saving = false;
            })
            .addCase(revokeModulesFromGroup.rejected, (state) => {
                state.saving = false;
            })
            .addCase(fetchGroupMembers.pending, (state) => {
                state.membersLoading = true;
            })
            .addCase(fetchGroupMembers.fulfilled, (state, action) => {
                state.membersLoading = false;
                state.members = action.payload;
            })
            .addCase(fetchGroupMembers.rejected, (state, action) => {
                state.membersLoading = false;
                state.error = action.error.message || 'Unable to load members';
            })
            .addCase(addGroupMember.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(addGroupMember.fulfilled, (state, action) => {
                state.saving = false;
                state.members = [...state.members, action.payload];
            })
            .addCase(addGroupMember.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to assign member';
            })
            .addCase(removeGroupMember.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(removeGroupMember.fulfilled, (state, action) => {
                state.saving = false;
                state.members = state.members.filter((member) => member.userId !== action.payload);
            })
            .addCase(removeGroupMember.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to remove member';
            });
    },
});

export const { clearUserGroupsError } = userGroupsSlice.actions;
export default userGroupsSlice.reducer;
