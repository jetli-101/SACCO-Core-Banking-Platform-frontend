// Endpoint paths exposed by WorkFlowTransitionController on the backend (Constants.WORKFLOW_TRANSITIONS_PATH = /api/workflow-transitions).
export const WORKFLOW_TRANSITION_ENDPOINTS = {
    ALL: (workFlowId: string) => `/workflow-transitions?workFlowId=${workFlowId}`,
    BY_ID: (id: string) => `/workflow-transitions/${id}`,
    CREATE: '/workflow-transitions',
    UPDATE: (id: string) => `/workflow-transitions/${id}`,
    DELETE: (id: string) => `/workflow-transitions/${id}`,
};
