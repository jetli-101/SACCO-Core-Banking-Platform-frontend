import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchWorkflowInTray,
    fetchAvailableTransitions,
    transitionWorkflowInstance,
    reassignWorkflowInstance,
    WorkflowInstance,
} from '@/store/slices/workflows/workflowInstancesSlice';
import { fetchWorkflowStages } from '@/store/slices/workflows/workflowStagesSlice';
import { fetchUsers } from '@/store/slices/users/usersSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { WorkflowInterfacePayload } from '@/pages/pages/interfaceRegistry';
import DefaultStageActionPanel from '@/components/workflow/DefaultStageActionPanel';
import StageDetailsModal from '@/components/workflow/StageDetailsModal';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StatCard from '@/components/ui/StatCard';
import DataGrid from '@/components/ui/DataGrid';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Spinner from '@/components/ui/Spinner';
import IconBox from '@/components/Icon/IconBox';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconCalendar from '@/components/Icon/IconCalendar';
import { dueLabel, enumLabel, isDueSoon, isOverdue, timeInTray } from '@/utils/workflowStage';
import IconXCircle from '@/components/Icon/IconXCircle';

const priorityBadgeVariant: Record<WorkflowInstance['priority'], 'info' | 'warning' | 'danger'> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
};

const WorkflowInTrayPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { inTray, inTrayLoading, availableTransitionsByInstance } = useAppSelector((state) => state.workflowInstances);
    const { stages } = useAppSelector((state) => state.workflowStages);
    const { users } = useAppSelector((state) => state.users);

    const [stageDetailsItem, setStageDetailsItem] = useState<WorkflowInstance | null>(null);
    const [forwardProcessItem, setForwardProcessItem] = useState<WorkflowInstance | null>(null);

    useEffect(() => {
        dispatch(fetchWorkflowInTray());
        dispatch(fetchUsers());
    }, [dispatch]);

    const counts = useMemo(
        () => ({
            total: inTray.length,
            highPriority: inTray.filter((item) => item.priority === 'HIGH').length,
            dueSoon: inTray.filter((item) => isDueSoon(item.dueDate)).length,
            overdue: inTray.filter((item) => isOverdue(item.dueDate)).length,
        }),
        [inTray]
    );

    const refresh = () => {
        setStageDetailsItem(null);
        setForwardProcessItem(null);
        dispatch(fetchWorkflowInTray());
    };

    const openStageDetails = (item: WorkflowInstance) => {
        setStageDetailsItem(item);
        dispatch(fetchWorkflowStages(item.workFlowId));
        if (!availableTransitionsByInstance[item.id]) {
            dispatch(fetchAvailableTransitions(item.id));
        }
    };

    const openForwardProcess = () => {
        if (!stageDetailsItem) return;
        setForwardProcessItem(stageDetailsItem);
        setStageDetailsItem(null);
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
        stages,
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
        onCancel: () => setForwardProcessItem(null),
    });

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3">
                <h1 className="text-xl font-bold">In-Tray</h1>
                <p className="text-white-dark">Workflows and tasks requiring your attention or action</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Items" value={counts.total} helperText="All items in your tray" icon={<IconBox className="h-4 w-4" />} />
                <StatCard
                    label="High Priority"
                    value={counts.highPriority}
                    helperText="Items needing immediate attention"
                    icon={<IconInfoTriangle className="h-4 w-4" />}
                    iconClassName="bg-danger-light text-danger"
                    className="border border-danger/50"
                />
                <StatCard
                    label="Due Soon"
                    value={counts.dueSoon}
                    helperText="Items due within 48 hours"
                    icon={<IconCalendar className="h-4 w-4" />}
                    iconClassName="bg-warning-light text-warning"
                    className="border border-warning/50"
                />
                <StatCard
                    label="Overdue"
                    value={counts.overdue}
                    helperText="Past their due date"
                    icon={<IconXCircle className="h-4 w-4" />}
                    iconClassName="bg-danger-light text-danger"
                />
            </div>

            <DataGrid
                className="mt-3"
                title="Pending Actions"
                count={inTray.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: WorkflowInstance) => (
                            <RowActionsMenu
                                onReview={() => router.push(`/dashboard/admin/workflows/in-tray/task/${row.id}`)}
                                onForward={() => openStageDetails(row)}
                                label={`Actions for ${row.processName}`}
                            />
                        ),
                    },
                    {
                        header: 'Process',
                        accessor: (row: WorkflowInstance) => (
                            <div>
                                <div className="font-semibold">{row.processName}</div>
                                <div className="text-xs text-white-dark">Ref: {row.referenceId || row.processCode}</div>
                            </div>
                        ),
                    },
                    { header: 'Initiator', accessor: (row: WorkflowInstance) => row.initiatedByName || <span className="text-white-dark">—</span> },
                    { header: 'Workflow', accessor: (row: WorkflowInstance) => row.workFlowName },
                    {
                        header: 'Current Stage',
                        accessor: (row: WorkflowInstance) => (
                            <div>
                                <Badge variant="info" outline>
                                    {row.currentStageName}
                                </Badge>
                                {row.assignedToName && <div className="mt-1 text-xs text-white-dark">Forwarded to {row.assignedToName}</div>}
                            </div>
                        ),
                    },
                    { header: 'Module', accessor: (row: WorkflowInstance) => enumLabel(row.processTypeKey) },
                    { header: 'Time in Tray', accessor: (row: WorkflowInstance) => timeInTray(row.initiatedAt) },
                    { header: 'Priority', accessor: (row: WorkflowInstance) => <Badge variant={priorityBadgeVariant[row.priority]}>{enumLabel(row.priority)}</Badge> },
                    {
                        header: 'Due',
                        accessor: (row: WorkflowInstance) => <span className={row.dueDate && dueLabel(row.dueDate) === 'Overdue' ? 'text-danger' : 'text-white-dark'}>{dueLabel(row.dueDate)}</span>,
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

            <StageDetailsModal isOpen={!!stageDetailsItem} instance={stageDetailsItem} stages={stages} onClose={() => setStageDetailsItem(null)} onForward={openForwardProcess} />

            <Modal
                isOpen={!!forwardProcessItem}
                onClose={() => setForwardProcessItem(null)}
                size="lg"
                title={
                    forwardProcessItem ? (
                        <div>
                            <div>Forward Process</div>
                            <div className="text-xs font-normal text-white-dark">
                                {forwardProcessItem.workFlowName} - #{forwardProcessItem.processCode}
                            </div>
                        </div>
                    ) : (
                        ''
                    )
                }
            >
                {forwardProcessItem &&
                    (!availableTransitionsByInstance[forwardProcessItem.id] ? (
                        <div className="flex items-center justify-center gap-2 py-6">
                            <Spinner className="h-4 w-4 text-primary" />
                            <span className="text-sm text-white-dark">Loading actions…</span>
                        </div>
                    ) : (
                        <DefaultStageActionPanel {...buildPayload(forwardProcessItem)} />
                    ))}
            </Modal>
        </div>
    );
};

export default WorkflowInTrayPage;
