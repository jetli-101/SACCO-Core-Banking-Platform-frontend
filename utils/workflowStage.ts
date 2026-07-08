import type { WorkflowStage } from '@/store/slices/workflows/workflowStagesSlice';

const HOUR_MS = 1000 * 60 * 60;
const DAY_MS = HOUR_MS * 24;

export const enumLabel = (value: string) =>
    value
        .toLowerCase()
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');

export const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const diff = new Date(dueDate).getTime() - Date.now();
    return diff >= 0 && diff <= 48 * HOUR_MS;
};

export const isOverdue = (dueDate?: string) => !!dueDate && new Date(dueDate).getTime() < Date.now();

// How long an item has been sitting in the tray since it was initiated.
export const timeInTray = (initiatedAt: string) => {
    const diff = Date.now() - new Date(initiatedAt).getTime();
    if (diff < HOUR_MS) return 'Just now';
    if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h`;
    return `${(diff / DAY_MS).toFixed(1)} days`;
};

// "Overdue" (matching the Stage Details reference), a formatted date, or "—" — instead of a
// styled date shown unconditionally, since a bare overdue date reads less urgently.
export const dueLabel = (dueDate?: string) => {
    if (!dueDate) return '—';
    return isOverdue(dueDate) ? 'Overdue' : new Date(dueDate).toLocaleDateString();
};

// Who's expected to act on a stage, derived from its responsibleType — used wherever a
// stage's owner needs a one-line label (Stage Details panels, Transition Details preview).
export const assignedGroupLabel = (stage?: WorkflowStage) => {
    if (!stage) return '—';
    switch (stage.responsibleType) {
        case 'GROUP':
            return stage.responsibleGroupName || 'Unassigned group';
        case 'ROLE':
            return stage.responsibleRoleName || 'Unassigned role';
        case 'USERS':
            return 'Specific users';
        default:
            return 'Any user';
    }
};

export const nextStageFor = (stages: WorkflowStage[], currentStage?: WorkflowStage) => {
    if (!currentStage) return undefined;
    return stages.find((stage) => stage.orderNo === currentStage.orderNo + 1);
};
