import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiPost, AUTH_ENDPOINTS } from '../../../urlhelper';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role?: string;
}

interface AuthResponse {
    user: AuthUser;
    accessToken: string;
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

const persistSession = (accessToken: string, user: AuthUser) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('authUser', JSON.stringify(user));
};

const clearSession = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
};

// No backend exists yet. With NEXT_PUBLIC_USE_FAKE_AUTH=true, every auth thunk below
// resolves locally instead of calling the API, so the login/register/OTP flow is
// fully testable end to end. Delete USE_FAKE_AUTH and the `if` branches below once
// the real backend is wired up — the apiPost calls already match the intended contract.
const USE_FAKE_AUTH = process.env.NEXT_PUBLIC_USE_FAKE_AUTH === 'true';
const fakeDelay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));
const fakeUserFromEmail = (email: string): AuthUser => ({ id: 'fake-user', name: email.split('@')[0] || 'Demo User', email, role: 'member' });

export const loginUser = createAsyncThunk('auth/login', async (credentials: { email: string; password: string }) => {
    if (USE_FAKE_AUTH) {
        await fakeDelay();
        const response: AuthResponse = { user: fakeUserFromEmail(credentials.email), accessToken: 'fake-dev-token' };
        persistSession(response.accessToken, response.user);
        return response;
    }
    const response = await apiPost<AuthResponse>(AUTH_ENDPOINTS.LOGIN, credentials);
    persistSession(response.accessToken, response.user);
    return response;
});

export const registerUser = createAsyncThunk('auth/register', async (payload: { name: string; email: string; password: string }) => {
    if (USE_FAKE_AUTH) {
        await fakeDelay();
        return { email: payload.email };
    }
    await apiPost(AUTH_ENDPOINTS.REGISTER, payload);
    return { email: payload.email };
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (payload: { email: string; code: string; purpose: 'register' | 'reset' }) => {
    if (USE_FAKE_AUTH) {
        await fakeDelay();
        if (payload.purpose === 'register') {
            const response: AuthResponse = { user: fakeUserFromEmail(payload.email), accessToken: 'fake-dev-token' };
            persistSession(response.accessToken, response.user);
            return response;
        }
        return {};
    }
    const response = await apiPost<Partial<AuthResponse>>(AUTH_ENDPOINTS.VERIFY_OTP, payload);
    if (response.accessToken && response.user) {
        persistSession(response.accessToken, response.user);
    }
    return response;
});

export const resendOtp = createAsyncThunk('auth/resendOtp', async (payload: { email: string; purpose: 'register' | 'reset' }) => {
    if (USE_FAKE_AUTH) {
        await fakeDelay();
        return payload.email;
    }
    await apiPost(AUTH_ENDPOINTS.RESEND_OTP, payload);
    return payload.email;
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (payload: { email: string }) => {
    if (USE_FAKE_AUTH) {
        await fakeDelay();
        return payload.email;
    }
    await apiPost(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload);
    return payload.email;
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async (payload: { email: string; code: string; password: string }) => {
    if (USE_FAKE_AUTH) {
        await fakeDelay();
        return payload.email;
    }
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
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.accessToken && action.payload.user) {
                    state.user = action.payload.user;
                    state.accessToken = action.payload.accessToken;
                    state.isAuthenticated = true;
                }
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
