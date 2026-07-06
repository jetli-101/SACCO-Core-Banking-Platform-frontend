// Endpoint paths exposed by WorkFlowController on the backend (Constants.WORKFLOWS_PATH = /api/workflows).
export const WORKFLOW_ENDPOINTS = {
    ALL: '/workflows',
    DASHBOARD: '/workflows/dashboard',
    BY_ID: (id: string) => `/workflows/${id}`,
    CREATE: '/workflows',
    UPDATE: (id: string) => `/workflows/${id}`,
    DELETE: (id: string) => `/workflows/${id}`,
};
