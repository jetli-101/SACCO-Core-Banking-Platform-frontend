import { useState } from 'react';
import type { WorkflowInterfacePayload } from '@/pages/pages/interfaceRegistry';
import { assignedGroupLabel } from '@/utils/workflowStage';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

const REASSIGN_VALUE = 'REASSIGN';

// The fallback action panel rendered for any stage that hasn't registered its own
// interface — implements the exact WorkflowInterfacePayload contract, same as any module
// screen would, so it doubles as the reference implementation for the registry. Doubles as
// the "Forward Process" form used by the row-level Forward quick action.
const DefaultStageActionPanel = ({
    data,
    availableTransitions,
    stages,
    currentStageId,
    users,
    onTransition,
    onReassign,
    onActed,
    onCancel,
}: WorkflowInterfacePayload) => {
    const [actionValue, setActionValue] = useState('');
    const [comment, setComment] = useState('');
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [assignedUserId, setAssignedUserId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentStage = stages.find((stage) => stage.id === currentStageId);
    const activeTransition = actionValue && actionValue !== REASSIGN_VALUE ? availableTransitions.find((t) => t.transitionId === actionValue) : undefined;
    const nextStage = activeTransition ? stages.find((stage) => stage.id === activeTransition.toStageId) : undefined;

    const resetForm = () => {
        setActionValue('');
        setComment('');
        setChecked({});
        setAssignedUserId('');
        setError(null);
    };

    const submit = async () => {
        if (!actionValue) {
            setError('Choose an action');
            return;
        }
        if (!comment.trim()) {
            setError('Remarks are required');
            return;
        }
        if (!assignedUserId) {
            setError('Choose who to assign this to');
            return;
        }

        if (actionValue === REASSIGN_VALUE) {
            setSubmitting(true);
            setError(null);
            try {
                await onReassign(assignedUserId, comment.trim());
                resetForm();
                onActed();
            } catch (err) {
                setError((err as { message?: string })?.message || 'Unable to forward this process');
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (!activeTransition) return;
        const missing = activeTransition.checklistItems.filter((item) => item.required && !checked[item.id]);
        if (activeTransition.requiresChecklistCompletion && missing.length > 0) {
            setError(`Complete all required checklist items: ${missing.map((m) => m.itemText).join(', ')}`);
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await onTransition(activeTransition.transitionId, {
                comment: comment.trim(),
                completedChecklistItemIds: Object.keys(checked).filter((id) => checked[id]),
            });
            await onReassign(assignedUserId);
            resetForm();
            onActed();
        } catch (err) {
            setError((err as { message?: string })?.message || 'Unable to take this action');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {data && Object.keys(data).length > 0 && (
                <pre className="max-h-40 overflow-auto rounded-md bg-[#f6f8fa] p-2.5 text-xs dark:bg-[#1b2e4b]">{JSON.stringify(data, null, 2)}</pre>
            )}

            {error && (
                <Alert variant="danger" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <div className="w-full">
                <label htmlFor="action" className="mb-1.5 block text-sm font-semibold">
                    Action *
                </label>
                <select id="action" className="form-select" value={actionValue} onChange={(e) => setActionValue(e.target.value)}>
                    <option value="">Select action</option>
                    {availableTransitions.map((transition) => (
                        <option key={transition.transitionId} value={transition.transitionId}>
                            {transition.name}
                        </option>
                    ))}
                    <option value={REASSIGN_VALUE}>Forward to another person (no stage change)</option>
                </select>
            </div>

            {activeTransition && (
                <div className="rounded-md border border-white-light p-3 dark:border-white/10">
                    <div className="text-xs font-semibold uppercase text-white-dark">Transition Details</div>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-md bg-[#f6f8fa] p-2.5 dark:bg-[#1b2e4b]">
                            <div className="text-xs text-white-dark">Current Stage</div>
                            <div className="font-semibold">{currentStage?.name}</div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                                <Badge variant="info" outline>
                                    {assignedGroupLabel(currentStage)}
                                </Badge>
                                <span className="text-white-dark">Interface: {currentStage?.interfaceKey || 'Default'}</span>
                            </div>
                        </div>
                        <div className="rounded-md bg-success-light p-2.5 dark:bg-success/10">
                            <div className="text-xs text-white-dark">Next Stage</div>
                            <div className="font-semibold">{nextStage?.name || activeTransition.toStageName}</div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                                <Badge variant="success" outline>
                                    {assignedGroupLabel(nextStage)}
                                </Badge>
                                <span className="text-white-dark">Interface: {nextStage?.interfaceKey || 'Default'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 rounded-md bg-warning-light p-2.5 dark:bg-warning/10">
                        <div className="text-xs text-white-dark">Action</div>
                        <div className="font-semibold">{activeTransition.name}</div>
                    </div>

                    {activeTransition.requiresChecklistCompletion && activeTransition.checklistItems.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            <div className="text-xs font-semibold uppercase text-white-dark">Checklist</div>
                            {activeTransition.checklistItems.map((item) => (
                                <Checkbox
                                    key={item.id}
                                    id={`checklist-${item.id}`}
                                    checked={!!checked[item.id]}
                                    onChange={(e) => setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                                    label={`${item.itemText}${item.required ? '' : ' (optional)'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Textarea id="remarks" label="Remarks *" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Enter your comments or remarks" />

            <div className="w-full">
                <label htmlFor="assign-to-user" className="mb-1.5 block text-sm font-semibold">
                    Assign to User *
                </label>
                <select id="assign-to-user" className="form-select" value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}>
                    <option value="">Select a user…</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.username} ({user.email})
                        </option>
                    ))}
                </select>
                {assignedUserId && (
                    <p className="mt-1 text-xs text-white-dark">Responsible Group: {assignedGroupLabel(actionValue === REASSIGN_VALUE ? currentStage : nextStage)}</p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
                {onCancel && (
                    <Button type="button" variant="outline-primary" onClick={onCancel} disabled={submitting}>
                        Cancel
                    </Button>
                )}
                <Button type="button" onClick={submit} disabled={submitting}>
                    {submitting && <Spinner className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />}
                    Forward Task
                </Button>
            </div>
        </div>
    );
};

export default DefaultStageActionPanel;
