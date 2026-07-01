// Endpoint paths the backend is expected to expose for authentication.
// These are relative to API_BASE_URL — update the paths here once the real
// backend contract is confirmed, nothing else in the frontend should need to change.
export const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGOUT: '/auth/logout',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CURRENT_USER: '/auth/me',
    // Invitation flow
    ACTIVATE: '/auth/activate',
    VERIFY_LOGIN_OTP: '/auth/verify-login-otp',
    CHANGE_TEMPORARY_PASSWORD: '/auth/change-temporary-password',
};
