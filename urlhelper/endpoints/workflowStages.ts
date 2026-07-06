// Endpoint paths exposed by WorkFlowStageController on the backend (Constants.WORKFLOW_STAGES_PATH = /api/workflow-stages).
export const WORKFLOW_STAGE_ENDPOINTS = {
    ALL: (workFlowId: string) => `/workflow-stages?workFlowId=${workFlowId}`,
    BY_ID: (id: string) => `/workflow-stages/${id}`,
    CREATE: '/workflow-stages',
    UPDATE: (id: string) => `/workflow-stages/${id}`,
    DELETE: (id: string) => `/workflow-stages/${id}`,
};
