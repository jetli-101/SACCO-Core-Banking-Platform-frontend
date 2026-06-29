import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiPut, MEMBER_ENDPOINTS } from '@/urlhelper';

// Matches UserResponse, nested inside MemberResponse.
export interface ProfileUser {
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

export interface ProfileNextOfKin {
    id?: string;
    name: string;
    relationship: string;
    phone: string;
    idNumber: string;
    address: string;
}

// Matches MemberResponse from MemberController.
export interface MemberProfile {
    id: string;
    memberNumber?: string;
    nationalId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
    kraPin?: string;
    employer?: string;
    county?: string;
    constituency?: string;
    ward?: string;
    postalAddress?: string;
    physicalAddress?: string;
    passportPhotoUrl?: string;
    signatureUrl?: string;
    nextOfKin?: ProfileNextOfKin;
    user: ProfileUser;
}

// Matches UpdateMemberRequest on the backend — deliberately excludes KYC fields
// (names, nationalId, dateOfBirth, gender), those are admin-only corrections.
export interface UpdateMemberPayload {
    occupation: string;
    employer?: string;
    county?: string;
    constituency: string;
    ward: string;
    postalAddress?: string;
    physicalAddress: string;
}

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface ProfileState {
    profile: MemberProfile | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: ProfileState = {
    profile: null,
    loading: false,
    saving: false,
    error: null,
};

export const fetchMyProfile = createAsyncThunk('profile/fetchMyProfile', async () => {
    const envelope = await apiGet<BackendEnvelope<MemberProfile>>(MEMBER_ENDPOINTS.ME);
    return envelope.data;
});

export const updateMyProfile = createAsyncThunk('profile/updateMyProfile', async (payload: UpdateMemberPayload) => {
    const envelope = await apiPut<BackendEnvelope<MemberProfile>>(MEMBER_ENDPOINTS.ME, payload);
    return envelope.data;
});

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        clearProfileError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(fetchMyProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to load profile';
            })
            .addCase(updateMyProfile.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateMyProfile.fulfilled, (state, action) => {
                state.saving = false;
                state.profile = action.payload;
            })
            .addCase(updateMyProfile.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message || 'Unable to update profile';
            });
    },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
