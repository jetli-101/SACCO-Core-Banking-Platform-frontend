// Endpoint paths exposed by WorkFlowInstanceController on the backend (Constants.WORKFLOW_INSTANCES_PATH = /api/workflow-instances).
export const WORKFLOW_INSTANCE_ENDPOINTS = {
    ALL: '/workflow-instances',
    IN_TRAY: '/workflow-instances/in-tray',
    DASHBOARD: '/workflow-instances/dashboard',
    BY_ID: (id: string) => `/workflow-instances/${id}`,
    AVAILABLE_TRANSITIONS: (id: string) => `/workflow-instances/${id}/available-transitions`,
    START: '/workflow-instances/start',
    TRANSITION: (id: string) => `/workflow-instances/${id}/transition`,
    REASSIGN: (id: string) => `/workflow-instances/${id}/reassign`,
};
