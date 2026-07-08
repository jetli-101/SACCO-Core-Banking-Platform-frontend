// Endpoint paths exposed by ChecklistController on the backend (Constants.CHECKLISTS_PATH = /api/checklists).
export const CHECKLIST_ENDPOINTS = {
    ALL: '/checklists',
    BY_ID: (id: string) => `/checklists/${id}`,
    CREATE: '/checklists',
    UPDATE: (id: string) => `/checklists/${id}`,
    DELETE: (id: string) => `/checklists/${id}`,
    ADD_ITEM: (checklistId: string) => `/checklists/${checklistId}/items`,
    UPDATE_ITEM: (checklistId: string, itemId: string) => `/checklists/${checklistId}/items/${itemId}`,
    DELETE_ITEM: (checklistId: string, itemId: string) => `/checklists/${checklistId}/items/${itemId}`,
    USAGES: (checklistId: string) => `/checklists/${checklistId}/usages`,
    LINK_STAGE: (checklistId: string, stageId: string) => `/checklists/${checklistId}/stages/${stageId}`,
    UNLINK_STAGE: (checklistId: string, stageId: string) => `/checklists/${checklistId}/stages/${stageId}`,
    WORKFLOW_LINKS: (workFlowId: string) => `/checklists/workflows/${workFlowId}/links`,
    ANALYTICS: '/checklists/analytics',
};
