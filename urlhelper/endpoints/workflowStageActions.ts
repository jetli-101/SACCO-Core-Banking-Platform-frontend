// Endpoint paths exposed by WorkFlowStageActionController on the backend (Constants.WORKFLOW_STAGE_ACTIONS_PATH = /api/workflow-stage-actions).
export const WORKFLOW_STAGE_ACTION_ENDPOINTS = {
    ALL: (stageId: string) => `/workflow-stage-actions?stageId=${stageId}`,
    CREATE: '/workflow-stage-actions',
    UPDATE: (id: string) => `/workflow-stage-actions/${id}`,
    DELETE: (id: string) => `/workflow-stage-actions/${id}`,
};
