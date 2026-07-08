import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchWorkflowInTray,
    fetchAvailableTransitions,
    transitionWorkflowInstance,
    reassignWorkflowInstance,
    WorkflowInstance,
} from '@/store/slices/workflows/workflowInstancesSlice';
import { fetchUsers } from '@/store/slices/users/usersSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { interfaceRegistry, WorkflowInterfacePayload } from '@/pages/pages/interfaceRegistry';
import DefaultStageActionPanel from '@/components/workflow/DefaultStageActionPanel';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StatCard from '@/components/ui/StatCard';
import DataGrid from '@/components/ui/DataGrid';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Spinner from '@/components/ui/Spinner';
import IconInbox from '@/components/Icon/IconInbox';
import IconInfoCircle from '@/components/Icon/IconInfoCircle';
import IconCalendar from '@/components/Icon/IconCalendar';

const priorityBadgeVariant: Record<WorkflowInstance['priority'], 'info' | 'warning' | 'danger'> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
};

const enumLabel = (value: string) =>
    value
        .toLowerCase()
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');

const WorkflowInTrayPage = () => {
    const dispatch = useAppDispatch();
    const { inTray, inTrayLoading, availableTransitionsByInstance } = useAppSelector((state) => state.workflowInstances);
    const { users } = useAppSelector((state) => state.users);

    const [reviewingItem, setReviewingItem] = useState<WorkflowInstance | null>(null);
    const [forwardingItem, setForwardingItem] = useState<WorkflowInstance | null>(null);
    const [forwardUserId, setForwardUserId] = useState('');
    const [forwardComment, setForwardComment] = useState('');
    const [forwarding, setForwarding] = useState(false);

    useEffect(() => {
        dispatch(fetchWorkflowInTray());
        dispatch(fetchUsers());
    }, [dispatch]);

    const counts = useMemo(
        () => ({
            total: inTray.length,
            highPriority: inTray.filter((item) => item.priority === 'HIGH').length,
            overdue: inTray.filter((item) => item.dueDate && new Date(item.dueDate).getTime() < Date.now()).length,
        }),
        [inTray]
    );

    const refresh = () => {
        setReviewingItem(null);
        setForwardingItem(null);
        dispatch(fetchWorkflowInTray());
    };

    const openReview = (item: WorkflowInstance) => {
        setReviewingItem(item);
        if (!availableTransitionsByInstance[item.id]) {
            dispatch(fetchAvailableTransitions(item.id));
        }
    };

    const openForward = (item: WorkflowInstance) => {
        setForwardingItem(item);
        setForwardUserId('');
        setForwardComment('');
    };

    const submitForward = async () => {
        if (!forwardingItem || !forwardUserId) return;
        setForwarding(true);
        try {
            await dispatch(reassignWorkflowInstance({ id: forwardingItem.id, payload: { assignedToUserId: forwardUserId, comment: forwardComment || undefined } })).unwrap();
            dispatch(showToast({ variant: 'success', message: `"${forwardingItem.processName}" forwarded` }));
            refresh();
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to forward this process' }));
        } finally {
            setForwarding(false);
        }
    };

    const buildPayload = (item: WorkflowInstance): WorkflowInterfacePayload => ({
        instanceId: item.id,
        processCode: item.processCode,
        processName: item.processName,
        referenceId: item.referenceId,
        workFlowId: item.workFlowId,
        currentStageId: item.currentStageId,
        currentStageName: item.currentStageName,
        status: item.status,
        priority: item.priority,
        data: item.data || {},
        availableTransitions: availableTransitionsByInstance[item.id] || [],
        users: users.map((user) => ({ id: user.id, username: user.username, email: user.email })),
        onTransition: async (transitionId, opts) => {
            try {
                await dispatch(transitionWorkflowInstance({ id: item.id, payload: { transitionId, ...opts } })).unwrap();
                dispatch(showToast({ variant: 'success', message: `"${item.processName}" moved forward` }));
            } catch (err) {
                dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to take this action' }));
                throw err;
            }
        },
        onReassign: async (userId, comment) => {
            try {
                await dispatch(reassignWorkflowInstance({ id: item.id, payload: { assignedToUserId: userId, comment } })).unwrap();
                dispatch(showToast({ variant: 'success', message: `"${item.processName}" forwarded` }));
            } catch (err) {
                dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to forward this process' }));
                throw err;
            }
        },
        onActed: refresh,
    });

    const ReviewActionPanel = reviewingItem
        ? interfaceRegistry[reviewingItem.currentStageInterfaceKey || '']?.component || DefaultStageActionPanel
        : null;

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3">
                <h1 className="text-xl font-bold">In-Tray</h1>
                <p className="text-white-dark">Workflow processes waiting for your action</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total Pending" value={counts.total} helperText="Waiting for your action" icon={<IconInbox className="h-4 w-4" />} />
                <StatCard
                    label="High Priority"
                    value={counts.highPriority}
                    helperText="Require immediate attention"
                    icon={<IconInfoCircle className="h-4 w-4" />}
                    iconClassName="bg-danger-light text-danger"
                />
                <StatCard
                    label="Overdue"
                    value={counts.overdue}
                    helperText="Past their due date"
                    icon={<IconCalendar className="h-4 w-4" />}
                    iconClassName="bg-warning-light text-warning"
                />
            </div>

            <DataGrid
                className="mt-3"
                title="Pending Actions"
                count={inTray.length}
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: WorkflowInstance) => (
                            <RowActionsMenu onReview={() => openReview(row)} onForward={() => openForward(row)} label={`Actions for ${row.processName}`} />
                        ),
                    },
                    {
                        header: 'Process',
                        accessor: (row: WorkflowInstance) => (
                            <div>
                                <div className="font-semibold">{row.processName}</div>
                                <div className="text-xs text-white-dark">#{row.processCode}</div>
                            </div>
                        ),
                    },
                    { header: 'Workflow', accessor: (row: WorkflowInstance) => row.workFlowName },
                    {
                        header: 'Current Stage',
                        accessor: (row: WorkflowInstance) => (
                            <div>
                                <div>{row.currentStageName}</div>
                                {row.assignedToName && <div className="text-xs text-white-dark">Forwarded to {row.assignedToName}</div>}
                            </div>
                        ),
                    },
                    { header: 'Priority', accessor: (row: WorkflowInstance) => <Badge variant={priorityBadgeVariant[row.priority]}>{enumLabel(row.priority)}</Badge> },
                    {
                        header: 'Due Date',
                        accessor: (row: WorkflowInstance) =>
                            row.dueDate ? (
                                <span className={new Date(row.dueDate).getTime() < Date.now() ? 'text-danger' : ''}>{new Date(row.dueDate).toLocaleDateString()}</span>
                            ) : (
                                <span className="text-white-dark">—</span>
                            ),
                    },
                ]}
                data={inTray}
                rowKey={(row) => row.id}
                searchKeys={['processCode', 'processName', 'workFlowName']}
                searchPlaceholder="Search..."
                loading={inTrayLoading}
                emptyMessage="Nothing waiting for you right now"
                onRefresh={() => dispatch(fetchWorkflowInTray())}
            />

            <Modal isOpen={!!reviewingItem} onClose={() => setReviewingItem(null)} title={reviewingItem ? `Act on ${reviewingItem.processName}` : ''} size="lg">
                {reviewingItem &&
                    (!availableTransitionsByInstance[reviewingItem.id] ? (
                        <div className="flex items-center justify-center gap-2 py-6">
                            <Spinner className="h-4 w-4 text-primary" />
                            <span className="text-sm text-white-dark">Loading actions…</span>
                        </div>
                    ) : (
                        ReviewActionPanel && <ReviewActionPanel {...buildPayload(reviewingItem)} />
                    ))}
            </Modal>

            <Modal isOpen={!!forwardingItem} onClose={() => setForwardingItem(null)} title={forwardingItem ? `Forward "${forwardingItem.processName}"` : ''}>
                <div className="space-y-4">
                    <div className="w-full">
                        <label htmlFor="forward-to-user" className="mb-1.5 block text-sm font-semibold">
                            Forward to *
                        </label>
                        <select id="forward-to-user" className="form-select" value={forwardUserId} onChange={(e) => setForwardUserId(e.target.value)}>
                            <option value="">Select a person…</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.username} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <Textarea id="forward-comment" label="Note (optional)" rows={3} value={forwardComment} onChange={(e) => setForwardComment(e.target.value)} />
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setForwardingItem(null)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={submitForward} disabled={forwarding || !forwardUserId}>
                            {forwarding && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            Forward
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WorkflowInTrayPage;
