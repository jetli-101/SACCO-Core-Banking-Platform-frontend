import { useState } from 'react';
import type { WorkflowInterfacePayload } from '@/pages/pages/interfaceRegistry';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

type Mode = { kind: 'transition'; transitionId: string } | { kind: 'reassign' } | null;

// The fallback action panel rendered for any stage that hasn't registered its own
// interface — implements the exact WorkflowInterfacePayload contract, same as any module
// screen would, so it doubles as the reference implementation for the registry.
const DefaultStageActionPanel = ({ data, availableTransitions, users, onTransition, onReassign, onActed }: WorkflowInterfacePayload) => {
    const [mode, setMode] = useState<Mode>(null);
    const [comment, setComment] = useState('');
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [forwardToUserId, setForwardToUserId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeTransition = mode?.kind === 'transition' ? availableTransitions.find((t) => t.transitionId === mode.transitionId) : null;

    const resetForm = () => {
        setMode(null);
        setComment('');
        setChecked({});
        setForwardToUserId('');
        setError(null);
    };

    const submitTransition = async () => {
        if (!activeTransition) return;
        if (activeTransition.requiresApprovalComment && !comment.trim()) {
            setError('A comment is required for this action');
            return;
        }
        const missing = activeTransition.checklistItems.filter((item) => item.required && !checked[item.id]);
        if (activeTransition.requiresChecklistCompletion && missing.length > 0) {
            setError(`Complete all required checklist items: ${missing.map((m) => m.itemText).join(', ')}`);
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await onTransition(activeTransition.transitionId, {
                comment: comment.trim() || undefined,
                completedChecklistItemIds: Object.keys(checked).filter((id) => checked[id]),
            });
            resetForm();
            onActed();
        } catch (err) {
            setError((err as { message?: string })?.message || 'Unable to take this action');
        } finally {
            setSubmitting(false);
        }
    };

    const submitReassign = async () => {
        if (!forwardToUserId) {
            setError('Choose who to forward this to');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await onReassign(forwardToUserId, comment.trim() || undefined);
            resetForm();
            onActed();
        } catch (err) {
            setError((err as { message?: string })?.message || 'Unable to forward this process');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            {data && Object.keys(data).length > 0 && (
                <pre className="max-h-40 overflow-auto rounded-md bg-[#f6f8fa] p-2.5 text-xs dark:bg-[#1b2e4b]">{JSON.stringify(data, null, 2)}</pre>
            )}

            {error && (
                <Alert variant="danger" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {!mode && (
                <div className="flex flex-wrap gap-2">
                    {availableTransitions.map((t) => (
                        <Button key={t.transitionId} size="sm" variant="outline-primary" onClick={() => setMode({ kind: 'transition', transitionId: t.transitionId })}>
                            {t.name}
                        </Button>
                    ))}
                    <Button size="sm" variant="outline-secondary" onClick={() => setMode({ kind: 'reassign' })}>
                        Forward to Person
                    </Button>
                </div>
            )}

            {mode?.kind === 'transition' && activeTransition && (
                <div className="space-y-3 rounded-md border border-white-light p-3 dark:border-white/10">
                    <p className="text-sm font-semibold">{activeTransition.name}</p>

                    {activeTransition.requiresChecklistCompletion && activeTransition.checklistItems.length > 0 && (
                        <div className="space-y-1.5">
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

                    {activeTransition.requiresApprovalComment && (
                        <Textarea id="transition-comment" label="Comment *" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
                    )}

                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline-primary" onClick={resetForm}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={submitTransition} disabled={submitting}>
                            {submitting && <Spinner className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />}
                            Confirm
                        </Button>
                    </div>
                </div>
            )}

            {mode?.kind === 'reassign' && (
                <div className="space-y-3 rounded-md border border-white-light p-3 dark:border-white/10">
                    <div>
                        <label htmlFor="forward-to" className="mb-1.5 block text-sm font-semibold">
                            Forward to *
                        </label>
                        <select id="forward-to" className="form-select" value={forwardToUserId} onChange={(e) => setForwardToUserId(e.target.value)}>
                            <option value="">Select a person…</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.username} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <Textarea id="reassign-comment" label="Note (optional)" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline-primary" onClick={resetForm}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={submitReassign} disabled={submitting}>
                            {submitting && <Spinner className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />}
                            Forward
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DefaultStageActionPanel;
