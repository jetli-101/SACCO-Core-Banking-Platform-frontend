import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    variant: ToastVariant;
    message: string;
}

interface ToastState {
    toasts: ToastMessage[];
}

const initialState: ToastState = { toasts: [] };

const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        showToast: {
            reducer(state, action: PayloadAction<ToastMessage>) {
                state.toasts.push(action.payload);
            },
            prepare(payload: { variant: ToastVariant; message: string }) {
                return { payload: { id: nanoid(), ...payload } };
            },
        },
        dismissToast(state, action: PayloadAction<string>) {
            state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
        },
    },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
