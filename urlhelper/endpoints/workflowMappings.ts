// Endpoint paths exposed by WorkFlowMappingController on the backend (Constants.WORKFLOW_MAPPINGS_PATH = /api/workflow-mappings).
export const WORKFLOW_MAPPING_ENDPOINTS = {
    ALL: '/workflow-mappings',
    CREATE: '/workflow-mappings',
    UPDATE: (id: string) => `/workflow-mappings/${id}`,
    DELETE: (id: string) => `/workflow-mappings/${id}`,
};
