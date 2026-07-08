// Endpoint paths exposed by WorkFlowInstanceHistoryController on the backend
// (Constants.WORKFLOW_INSTANCE_HISTORY_PATH = /api/workflow-instance-history).
export const WORKFLOW_INSTANCE_HISTORY_ENDPOINTS = {
    ALL: (instanceId: string) => `/workflow-instance-history?instanceId=${instanceId}`,
    OUT_TRAY: '/workflow-instance-history/out-tray',
};
