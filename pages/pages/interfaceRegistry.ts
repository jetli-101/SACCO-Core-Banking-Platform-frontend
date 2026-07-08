import type { ComponentType } from 'react';
import type { WorkflowStage } from '@/store/slices/workflows/workflowStagesSlice';
import LoanReviewPanel from '@/components/loans/LoanReviewPanel';

// One transition the caller could take next from an instance's current stage — matches
// AvailableTransitionResponse on the backend (GET /workflow-instances/{id}/available-transitions).
export interface WorkflowAvailableTransition {
    transitionId: string;
    name: string;
    actionType: string;
    toStageId: string;
    toStageName: string;
    requiresChecklistCompletion: boolean;
    requiresApprovalComment: boolean;
    checklistItems: { id: string; itemText: string; required: boolean; orderNo: number }[];
}

/**
 * What a registered stage-interface component receives when the In-Tray renders it for an
 * instance. The component only renders the action UI (approve/reject/forward buttons,
 * comment box, checklist) — it never calls the workflow API directly. It reads `data` for
 * context and calls the provided callbacks; the In-Tray container owns the actual
 * transition/reassign requests and refetching the tray afterwards.
 */
export interface WorkflowInterfacePayload {
    instanceId: string;
    processCode: string;
    processName: string;
    referenceId?: string;
    workFlowId: string;
    currentStageId: string;
    currentStageName: string;
    status: string;
    priority: string;
    /** The instance's module-specific JSON payload (e.g. claim fields, loan fields...). */
    data: Record<string, unknown>;
    availableTransitions: WorkflowAvailableTransition[];
    /** Every stage of this instance's workflow, ordered — lets the panel show where a transition leads (name, responsible group, interface) before it's taken. */
    stages: WorkflowStage[];
    /** Directory to pick a "forward to" target from. */
    users: { id: string; username: string; email: string }[];
    /** Forward to another stage. */
    onTransition: (transitionId: string, opts?: { comment?: string; completedChecklistItemIds?: string[] }) => Promise<void>;
    /** Forward to another person, same stage. */
    onReassign: (userId: string, comment?: string) => Promise<void>;
    /** Call once an action has completed so the In-Tray can refetch/drop this card. */
    onActed: () => void;
    /** Shows a Cancel affordance when the panel is rendered inside a modal (e.g. the row-level "Forward" quick action) — omitted on a standalone page like Task Details. */
    onCancel?: () => void;
}

export type WorkflowInterfaceComponent = ComponentType<WorkflowInterfacePayload>;

export interface WorkflowInterfaceDefinition {
    /** Stable id stored on WorkFlowStage.interfaceKey — pick this when configuring a stage. */
    key: string;
    /** Human label shown in the Stage form's "Interface" dropdown. */
    label: string;
    /** Where the component lives — the import path used to bring it in, kept alongside the entry for reference/traceability (e.g. '@/components/claims/ClaimReviewPanel'). */
    path: string;
    /** What this interface does — shown as helper text once picked in the Stage form. */
    description: string;
    component: WorkflowInterfaceComponent;
}

/**
 * The interface registry: every stage-action screen a module wants to plug into the
 * workflow engine is registered here under a unique key. A WorkFlowStage stores that key
 * (interfaceKey); the In-Tray looks it up at render time to decide which component renders
 * the action panel for instances sitting at that stage. Stages with no key (or a key not
 * registered here) fall back to the generic DefaultStageActionPanel.
 *
 * To plug in a module screen, import it here and register it, e.g.:
 *   import ClaimReviewPanel from '@/components/claims/ClaimReviewPanel';
 *   registerWorkflowInterface({
 *       key: 'CLAIM_REVIEW',
 *       label: 'Claim Review',
 *       path: '@/components/claims/ClaimReviewPanel',
 *       description: 'Approve, reject, or return a claim under review.',
 *       component: ClaimReviewPanel,
 *   });
 */
export const interfaceRegistry: Record<string, WorkflowInterfaceDefinition> = {};

export const registerWorkflowInterface = (definition: WorkflowInterfaceDefinition) => {
    interfaceRegistry[definition.key] = definition;
};

/** Options for the Stage form's "Interface" select. */
export const getWorkflowInterfaceOptions = () => Object.values(interfaceRegistry).map(({ key, label, path, description }) => ({ value: key, label, path, description }));

registerWorkflowInterface({
    key: 'LOAN_REVIEW',
    label: 'Loan Review',
    path: '@/components/loans/LoanReviewPanel',
    description: 'Shows the loan summary (member, type, amount, purpose) and lets the reviewer approve, reject, return, or forward it.',
    component: LoanReviewPanel,
});

// Next.js treats every file under pages/ as a route, so this config module needs a valid
// default export to avoid breaking `next build` — it's never meant to be navigated to.
const InterfaceRegistryRouteStub = () => null;
export default InterfaceRegistryRouteStub;
