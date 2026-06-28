import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import authSlice from './slices/auth/authSlice';
import modulesSlice from './slices/modules/modulesSlice';
import toastSlice from './slices/ui/toastSlice';

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    auth: authSlice,
    modules: modulesSlice,
    toast: toastSlice,
});

export default configureStore({
    reducer: rootReducer,
});

export type IRootState = ReturnType<typeof rootReducer>;
