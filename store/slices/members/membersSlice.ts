import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, MEMBER_ENDPOINTS } from '@/urlhelper';
import { MemberProfile } from '@/store/slices/profile/profileSlice';

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface MembersState {
    members: MemberProfile[];
    loading: boolean;
    error: string | null;
}

const initialState: MembersState = {
    members: [],
    loading: false,
    error: null,
};

export const fetchMembers = createAsyncThunk('members/fetchMembers', async () => {
    const envelope = await apiGet<BackendEnvelope<MemberProfile[]>>(MEMBER_ENDPOINTS.ALL);
    return envelope.data;
});

const membersSlice = createSlice({
    name: 'members',
    initialState,
    reducers: {
        clearMembersError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMembers.fulfilled, (state, action) => {
                state.loading = false;
                state.members = action.payload;
            })
            .addCase(fetchMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load members';
            });
    },
});

export const { clearMembersError } = membersSlice.actions;
export default membersSlice.reducer;
