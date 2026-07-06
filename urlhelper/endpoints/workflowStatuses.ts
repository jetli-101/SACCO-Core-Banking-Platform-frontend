// Endpoint paths exposed by WorkFlowStatusController on the backend (Constants.WORKFLOW_STATUSES_PATH = /api/workflow-statuses).
export const WORKFLOW_STATUS_ENDPOINTS = {
    ALL: '/workflow-statuses',
    CREATE: '/workflow-statuses',
    UPDATE: (id: string) => `/workflow-statuses/${id}`,
    DELETE: (id: string) => `/workflow-statuses/${id}`,
};
