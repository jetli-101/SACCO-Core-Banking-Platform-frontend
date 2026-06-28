import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiPost, AUTH_ENDPOINTS } from '../../../urlhelper';

// Matches UserResponse from the backend's AuthController/UserController exactly.
export interface AuthUser {
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

// Matches AuthResponse from AuthController (login/refresh).
interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: AuthUser;
}

// Every AuthController method wraps its payload in this envelope.
interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface NextOfKin {
    name: string;
    relationship: string;
    phone: string;
    idNumber: string;
    address: string;
}

export interface RegisterPayload {
    saccoCode: string;
    email: string;
    phone: string;
    password: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    nationalId: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    occupation?: string;
    kraPin?: string;
    employer?: string;
    county?: string;
    constituency?: string;
    ward?: string;
    postalAddress?: string;
    physicalAddress?: string;
    nextOfKin: NextOfKin;
}

interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    pendingVerificationEmail: string | null;
}

const initialState: AuthState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    pendingVerificationEmail: null,
};

const persistSession = (accessToken: string, refreshToken: string, user: AuthUser) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('authUser', JSON.stringify(user));
};

const clearSession = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
};

export const loginUser = createAsyncThunk('auth/login', async (credentials: { email: string; password: string }) => {
    const envelope = await apiPost<BackendEnvelope<AuthResponse>>(AUTH_ENDPOINTS.LOGIN, credentials);
    persistSession(envelope.data.accessToken, envelope.data.refreshToken, envelope.data.user);
    return envelope.data;
});

export const registerUser = createAsyncThunk('auth/register', async (payload: RegisterPayload) => {
    const envelope = await apiPost<BackendEnvelope<{ userId: string; memberId: string; email: string; status: string }>>(AUTH_ENDPOINTS.REGISTER, payload);
    return envelope.data;
});

// `purpose` only ever drives client-side UI branching now — the real backend's
// verify-otp/send-otp endpoints always operate on a REGISTRATION-purpose code, there is
// no password-reset OTP endpoint yet, so the 'reset' branch hits the same endpoint with
// its old payload shape rather than a real endpoint that doesn't exist.
export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (payload: { email: string; code: string; purpose: 'register' | 'reset' }) => {
    if (payload.purpose === 'register') {
        await apiPost<BackendEnvelope<null>>(AUTH_ENDPOINTS.VERIFY_OTP, { email: payload.email, otp: payload.code });
        return {};
    }
    await apiPost(AUTH_ENDPOINTS.VERIFY_OTP, payload);
    return {};
});

export const resendOtp = createAsyncThunk('auth/resendOtp', async (payload: { email: string; purpose: 'register' | 'reset' }) => {
    if (payload.purpose === 'register') {
        await apiPost(AUTH_ENDPOINTS.SEND_OTP, { email: payload.email });
    } else {
        await apiPost(AUTH_ENDPOINTS.RESEND_OTP, payload);
    }
    return payload.email;
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (payload: { email: string }) => {
    await apiPost(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload);
    return payload.email;
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async (payload: { email: string; code: string; password: string }) => {
    await apiPost(AUTH_ENDPOINTS.RESET_PASSWORD, payload);
    return payload.email;
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        hydrateAuth(state) {
            const accessToken = localStorage.getItem('accessToken');
            const storedUser = localStorage.getItem('authUser');
            if (accessToken && storedUser) {
                state.accessToken = accessToken;
                state.user = JSON.parse(storedUser);
                state.isAuthenticated = true;
            }
        },
        logout(state) {
            clearSession();
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
        },
        clearAuthError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to login';
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingVerificationEmail = action.payload.email;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to register';
            })
            .addCase(verifyOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyOtp.fulfilled, (state) => {
                state.loading = false;
                state.pendingVerificationEmail = null;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Invalid or expired code';
            })
            .addCase(forgotPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingVerificationEmail = action.payload;
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to send reset code';
            })
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.loading = false;
                state.pendingVerificationEmail = null;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Unable to reset password';
            })
            .addCase(resendOtp.rejected, (state, action) => {
                state.error = action.error.message || 'Unable to resend code';
            });
    },
});

export const { hydrateAuth, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
