// Endpoint paths exposed by WorkFlowStateController on the backend (Constants.WORKFLOW_STATES_PATH = /api/workflow-states).
// Read-only from the frontend for now — the DRAFT/ACTIVE/ARCHIVED catalog is seeded by
// WorkFlowStateSeeder on the backend, not managed through an admin UI.
export const WORKFLOW_STATE_ENDPOINTS = {
    ALL: '/workflow-states',
};
