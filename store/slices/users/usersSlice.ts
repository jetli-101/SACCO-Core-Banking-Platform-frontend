import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, USER_ENDPOINTS } from '@/urlhelper';

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
    error: string | null;
}

const initialState: UsersState = {
    users: [],
    loading: false,
    error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
    const response = await apiGet<BackendEnvelope<AppUser[]>>(USER_ENDPOINTS.ALL);
    return response.data;
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
            });
    },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
