// Barrel for every endpoint group. As new backend domains come online
// (members, loans, savings, SASRA reports, ...) add a file here and export it,
// following the same pattern as auth.ts.
export * from './auth';
export * from './modules';
export * from './roles';
export * from './members';
export * from './userGroups';
export * from './users';
export * from './workflows';
export * from './workflowStages';
export * from './workflowTransitions';
export * from './workflowStageActions';
export * from './workflowStatuses';
export * from './workflowStates';
export * from './workflowInstances';
export * from './workflowInstanceHistory';
export * from './workflowMappings';
export * from './loans';
export * from './checklists';
export * from './savings';
