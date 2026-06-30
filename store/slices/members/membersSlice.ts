import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiPut, MEMBER_ENDPOINTS } from '@/urlhelper';
import { MemberProfile, UpdateMemberPayload } from '@/store/slices/profile/profileSlice';

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface MembersState {
    members: MemberProfile[];
    loading: boolean;
    error: string | null;
    selectedMember: MemberProfile | null;
    selectedLoading: boolean;
    selectedError: string | null;
    saving: boolean;
}

const initialState: MembersState = {
    members: [],
    loading: false,
    error: null,
    selectedMember: null,
    selectedLoading: false,
    selectedError: null,
    saving: false,
};

export const fetchMembers = createAsyncThunk('members/fetchMembers', async () => {
    const envelope = await apiGet<BackendEnvelope<MemberProfile[]>>(MEMBER_ENDPOINTS.ALL);
    return envelope.data;
});

export const fetchMemberById = createAsyncThunk('members/fetchMemberById', async (id: string) => {
    const envelope = await apiGet<BackendEnvelope<MemberProfile>>(MEMBER_ENDPOINTS.BY_ID(id));
    return envelope.data;
});

export const updateMember = createAsyncThunk('members/updateMember', async ({ id, payload }: { id: string; payload: UpdateMemberPayload }) => {
    const envelope = await apiPut<BackendEnvelope<MemberProfile>>(MEMBER_ENDPOINTS.BY_ID(id), payload);
    return envelope.data;
});

const membersSlice = createSlice({
    name: 'members',
    initialState,
    reducers: {
        clearMembersError(state) {
            state.error = null;
        },
        clearSelectedMember(state) {
            state.selectedMember = null;
            state.selectedError = null;
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
            })
            .addCase(fetchMemberById.pending, (state) => {
                state.selectedLoading = true;
                state.selectedError = null;
            })
            .addCase(fetchMemberById.fulfilled, (state, action) => {
                state.selectedLoading = false;
                state.selectedMember = action.payload;
            })
            .addCase(fetchMemberById.rejected, (state, action) => {
                state.selectedLoading = false;
                state.selectedError = action.error.message || 'Unable to load member';
            })
            .addCase(updateMember.pending, (state) => {
                state.saving = true;
                state.selectedError = null;
            })
            .addCase(updateMember.fulfilled, (state, action) => {
                state.saving = false;
                state.selectedMember = action.payload;
                const index = state.members.findIndex((member) => member.id === action.payload.id);
                if (index >= 0) state.members[index] = action.payload;
            })
            .addCase(updateMember.rejected, (state, action) => {
                state.saving = false;
                state.selectedError = action.error.message || 'Unable to update member';
            });
    },
});

export const { clearMembersError, clearSelectedMember } = membersSlice.actions;
export default membersSlice.reducer;
