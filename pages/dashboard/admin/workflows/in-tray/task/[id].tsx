import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchWorkflowInstanceById,
    fetchAvailableTransitions,
    transitionWorkflowInstance,
    reassignWorkflowInstance,
} from '@/store/slices/workflows/workflowInstancesSlice';
import { fetchWorkflowStages } from '@/store/slices/workflows/workflowStagesSlice';
import { fetchUsers } from '@/store/slices/users/usersSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { interfaceRegistry, WorkflowInterfacePayload } from '@/pages/pages/interfaceRegistry';
import DefaultStageActionPanel from '@/components/workflow/DefaultStageActionPanel';
import WorkflowStageProgress from '@/components/workflow/WorkflowStageProgress';
import { dueLabel, enumLabel, isOverdue, timeInTray } from '@/utils/workflowStage';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';

const statusBadgeVariant: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    INITIATED: 'info',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    REJECTED: 'danger',
};

const priorityBadgeVariant: Record<string, 'info' | 'warning' | 'danger'> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
};

const TaskDetailsPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const id = typeof router.query.id === 'string' ? router.query.id : '';

    const { instances, availableTransitionsByInstance } = useAppSelector((state) => state.workflowInstances);
    const { stages } = useAppSelector((state) => state.workflowStages);
    const { users } = useAppSelector((state) => state.users);

    const instance = instances.find((item) => item.id === id);

    useEffect(() => {
        if (!id) return;
        dispatch(fetchWorkflowInstanceById(id));
        dispatch(fetchAvailableTransitions(id));
        dispatch(fetchUsers());
    }, [dispatch, id]);

    useEffect(() => {
        if (instance?.workFlowId) dispatch(fetchWorkflowStages(instance.workFlowId));
    }, [dispatch, instance?.workFlowId]);

    const payload: WorkflowInterfacePayload | null = useMemo(() => {
        if (!instance) return null;
        return {
            instanceId: instance.id,
            processCode: instance.processCode,
            processName: instance.processName,
            referenceId: instance.referenceId,
            workFlowId: instance.workFlowId,
            currentStageId: instance.currentStageId,
            currentStageName: instance.currentStageName,
            status: instance.status,
            priority: instance.priority,
            data: instance.data || {},
            availableTransitions: availableTransitionsByInstance[instance.id] || [],
            stages,
            users: users.map((user) => ({ id: user.id, username: user.username, email: user.email })),
            onTransition: async (transitionId, opts) => {
                try {
                    await dispatch(transitionWorkflowInstance({ id: instance.id, payload: { transitionId, ...opts } })).unwrap();
                    dispatch(showToast({ variant: 'success', message: `"${instance.processName}" moved forward` }));
                } catch (err) {
                    dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to take this action' }));
                    throw err;
                }
            },
            onReassign: async (userId, comment) => {
                try {
                    await dispatch(reassignWorkflowInstance({ id: instance.id, payload: { assignedToUserId: userId, comment } })).unwrap();
                    dispatch(showToast({ variant: 'success', message: `"${instance.processName}" forwarded` }));
                } catch (err) {
                    dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to forward this process' }));
                    throw err;
                }
            },
            onActed: () => {
                dispatch(fetchWorkflowInstanceById(instance.id));
                dispatch(fetchAvailableTransitions(instance.id));
            },
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instance, stages, users, availableTransitionsByInstance]);

    const ActionPanel = instance ? interfaceRegistry[instance.currentStageInterfaceKey || '']?.component || DefaultStageActionPanel : null;
    const transitionsLoaded = instance ? !!availableTransitionsByInstance[instance.id] : false;

    return (
        <div>
            <Breadcrumb trailingLabel={instance?.processCode} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <h1 className="text-xl font-bold">Task Details</h1>
                <Button variant="outline-primary" href="/dashboard/admin/workflows/in-tray">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to In-Tray
                </Button>
            </div>

            {!instance ? (
                <div className="panel mt-3 flex min-h-[200px] items-center justify-center gap-2">
                    <Spinner className="h-5 w-5 text-primary" />
                    <span className="text-white-dark">Loading…</span>
                </div>
            ) : (
                <>
                    <div className="mt-1">
                        <div className="text-lg font-bold">#{instance.processCode}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white-dark">
                            <span>{instance.workFlowName}</span>
                            <span className={isOverdue(instance.dueDate) ? 'text-danger' : ''}>Due: {dueLabel(instance.dueDate)}</span>
                            <span>In tray: {timeInTray(instance.initiatedAt)}</span>
                            <Badge variant={priorityBadgeVariant[instance.priority]}>{enumLabel(instance.priority)} Priority</Badge>
                            <Badge variant={statusBadgeVariant[instance.status]} outline>
                                {enumLabel(instance.status)}
                            </Badge>
                        </div>
                    </div>

                    <div className="panel mt-3">
                        <WorkflowStageProgress
                            workFlowName={instance.workFlowName}
                            currentStageId={instance.currentStageId}
                            currentStageName={instance.currentStageName}
                            stages={stages}
                            detailsContent={
                                instance.data && Object.keys(instance.data).length > 0 ? (
                                    <pre className="max-h-40 overflow-auto rounded-md bg-[#f6f8fa] p-2.5 text-xs dark:bg-[#1b2e4b]">{JSON.stringify(instance.data, null, 2)}</pre>
                                ) : undefined
                            }
                        />
                    </div>

                    <div className="panel mt-3">
                        {!transitionsLoaded ? (
                            <div className="flex items-center justify-center gap-2 py-6">
                                <Spinner className="h-4 w-4 text-primary" />
                                <span className="text-sm text-white-dark">Loading actions…</span>
                            </div>
                        ) : (
                            ActionPanel && payload && <ActionPanel {...payload} />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TaskDetailsPage;
