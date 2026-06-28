// Endpoint paths the backend is expected to expose for authentication.
// These are relative to API_BASE_URL — update the paths here once the real
// backend contract is confirmed, nothing else in the frontend should need to change.
export const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    // Confirmed against AuthController: the real backend always issues a REGISTRATION-purpose
    // OTP for these two, regardless of caller intent — there is no password-reset OTP endpoint yet.
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGOUT: '/auth/logout',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CURRENT_USER: '/auth/me',
};
