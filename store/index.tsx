import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import authSlice from './slices/auth/authSlice';
import modulesSlice from './slices/modules/modulesSlice';
import rolesSlice from './slices/roles/rolesSlice';
import profileSlice from './slices/profile/profileSlice';
import membersSlice from './slices/members/membersSlice';
import userGroupsSlice from './slices/userGroups/userGroupsSlice';
import usersSlice from './slices/users/usersSlice';
import toastSlice from './slices/ui/toastSlice';
import workflowsSlice from './slices/workflows/workflowsSlice';
import workflowStagesSlice from './slices/workflows/workflowStagesSlice';
import workflowTransitionsSlice from './slices/workflows/workflowTransitionsSlice';
import workflowStatusesSlice from './slices/workflows/workflowStatusesSlice';
import workflowStatesSlice from './slices/workflows/workflowStatesSlice';
import workflowInstancesSlice from './slices/workflows/workflowInstancesSlice';
import workflowInstanceHistorySlice from './slices/workflows/workflowInstanceHistorySlice';
import workflowMappingsSlice from './slices/workflows/workflowMappingsSlice';
import loansSlice from './slices/loans/loansSlice';

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    auth: authSlice,
    modules: modulesSlice,
    roles: rolesSlice,
    profile: profileSlice,
    members: membersSlice,
    userGroups: userGroupsSlice,
    users: usersSlice,
    toast: toastSlice,
    workflows: workflowsSlice,
    workflowStages: workflowStagesSlice,
    workflowTransitions: workflowTransitionsSlice,
    workflowStatuses: workflowStatusesSlice,
    workflowStates: workflowStatesSlice,
    workflowInstances: workflowInstancesSlice,
    workflowInstanceHistory: workflowInstanceHistorySlice,
    workflowMappings: workflowMappingsSlice,
    loans: loansSlice,
});

export default configureStore({
    reducer: rootReducer,
});

export type IRootState = ReturnType<typeof rootReducer>;
