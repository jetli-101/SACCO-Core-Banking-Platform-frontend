import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiPost, USER_ENDPOINTS, MEMBER_ENDPOINTS } from '@/urlhelper';

export interface InviteUserPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleNames: string[];
}

// Matches UserResponse on the backend.
export interface AppUser {
    id: string;
    saccoId?: string;
    saccoName?: string;
    username: string;
    email: string;
    phone?: string;
    roles: string[];
    status?: string;
    memberId?: string;
    lastLoginAt?: string;
    createdAt?: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface UsersState {
    users: AppUser[];
    loading: boolean;
    actioningId: string | null;
    error: string | null;
}

const initialState: UsersState = {
    users: [],
    loading: false,
    actioningId: null,
    error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<AppUser[]>>(USER_ENDPOINTS.ALL);
    return response.data;
});

export const inviteUser = createAsyncThunk('users/invite', async (payload: InviteUserPayload, { dispatch }) => {
    const response = await apiPost<BackendEnvelope<AppUser>>(USER_ENDPOINTS.INVITE, payload);
    await dispatch(fetchUsers());
    return response.data;
});

// Suspends/locks/deactivates/reactivates an already-active account. Approving or
// rejecting a still-PENDING registration goes through the member-approval thunks below
// instead — the backend rejects PENDING/REJECTED transitions on this endpoint.
export const updateUserStatus = createAsyncThunk('users/updateStatus', async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
    const response = await apiPost<BackendEnvelope<AppUser>>(USER_ENDPOINTS.STATUS(id), { status, reason });
    return response.data;
});

export const approveMember = createAsyncThunk('users/approveMember', async ({ memberId, comments }: { memberId: string; comments?: string }, { dispatch }) => {
    await apiPost(MEMBER_ENDPOINTS.APPROVE(memberId), { comments });
    await dispatch(fetchUsers());
});

export const rejectMember = createAsyncThunk('users/rejectMember', async ({ memberId, comments }: { memberId: string; comments?: string }, { dispatch }) => {
    await apiPost(MEMBER_ENDPOINTS.REJECT(memberId), { comments });
    await dispatch(fetchUsers());
});

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearUsersError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load users';
            })
            .addCase(updateUserStatus.pending, (state, action) => {
                state.actioningId = action.meta.arg.id;
                state.error = null;
            })
            .addCase(updateUserStatus.fulfilled, (state, action) => {
                state.actioningId = null;
                const index = state.users.findIndex((user) => user.id === action.payload.id);
                if (index !== -1) state.users[index] = action.payload;
            })
            .addCase(updateUserStatus.rejected, (state, action) => {
                state.actioningId = null;
                state.error = action.error.message || 'Unable to update account status';
            })
            .addCase(approveMember.pending, (state, action) => {
                state.actioningId = action.meta.arg.memberId;
                state.error = null;
            })
            .addCase(approveMember.fulfilled, (state) => {
                state.actioningId = null;
            })
            .addCase(approveMember.rejected, (state, action) => {
                state.actioningId = null;
                state.error = action.error.message || 'Unable to approve member';
            })
            .addCase(rejectMember.pending, (state, action) => {
                state.actioningId = action.meta.arg.memberId;
                state.error = null;
            })
            .addCase(rejectMember.fulfilled, (state) => {
                state.actioningId = null;
            })
            .addCase(rejectMember.rejected, (state, action) => {
                state.actioningId = null;
                state.error = action.error.message || 'Unable to reject member';
            })
            .addCase(inviteUser.pending, (state) => {
                state.actioningId = 'invite';
                state.error = null;
            })
            .addCase(inviteUser.fulfilled, (state) => {
                state.actioningId = null;
            })
            .addCase(inviteUser.rejected, (state, action) => {
                state.actioningId = null;
                state.error = action.error.message || 'Unable to send invitation';
            });
    },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
