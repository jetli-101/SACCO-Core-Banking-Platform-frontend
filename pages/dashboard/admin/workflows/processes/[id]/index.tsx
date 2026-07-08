import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflowInstanceById } from '@/store/slices/workflows/workflowInstancesSlice';
import { fetchWorkflowInstanceHistory } from '@/store/slices/workflows/workflowInstanceHistorySlice';
import { fetchWorkflowStages } from '@/store/slices/workflows/workflowStagesSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';
import IconClock from '@/components/Icon/IconClock';
import IconFile from '@/components/Icon/IconFile';

type TabKey = 'overview' | 'stages' | 'timeline';

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

const WorkflowInstanceDetailPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const id = typeof router.query.id === 'string' ? router.query.id : '';
    const initialTab = typeof router.query.tab === 'string' ? (router.query.tab as TabKey) : 'overview';

    const { instances } = useAppSelector((state) => state.workflowInstances);
    const { entries: history, loading: historyLoading } = useAppSelector((state) => state.workflowInstanceHistory);
    const { stages } = useAppSelector((state) => state.workflowStages);
    const instance = instances.find((item) => item.id === id);

    const [tab, setTab] = useState<TabKey>(initialTab);

    useEffect(() => {
        if (!id) return;
        dispatch(fetchWorkflowInstanceById(id));
        dispatch(fetchWorkflowInstanceHistory(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (instance?.workFlowId) dispatch(fetchWorkflowStages(instance.workFlowId));
    }, [dispatch, instance?.workFlowId]);

    const sortedHistory = useMemo(() => [...history].sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()), [history]);

    const tabItems = useMemo(
        () => [
            { key: 'overview', label: 'Overview' },
            { key: 'stages', label: 'Workflow Stages' },
            { key: 'timeline', label: 'Timeline & Audit' },
        ],
        []
    );

    return (
        <div>
            <Breadcrumb trailingLabel={instance?.processName} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">{instance?.processName || '…'}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white-dark">
                        <span>Ref: {instance?.processCode}</span>
                        {instance && <Badge variant={statusBadgeVariant[instance.status]}>{instance.currentStatusName || instance.status}</Badge>}
                        {instance && <Badge variant={priorityBadgeVariant[instance.priority]}>{instance.priority} Priority</Badge>}
                    </div>
                </div>
                <Button variant="outline-primary" href="/dashboard/admin/workflows/processes">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to Processes
                </Button>
            </div>

            <div className="panel mt-3">
                <Tabs items={tabItems} active={tab} onChange={(key) => setTab(key as TabKey)} />

                {tab === 'overview' && instance && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase text-white-dark">Process</p>
                            <p className="mt-1 text-sm">
                                <span className="text-white-dark">Workflow:</span> {instance.workFlowName}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Process Type:</span> {instance.processTypeKey}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Current Stage:</span> {instance.currentStageName}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Current Status:</span> {instance.currentStatusName || '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-white-dark">People & Dates</p>
                            <p className="mt-1 text-sm">
                                <span className="text-white-dark">Initiated By:</span> {instance.initiatedByName || '—'}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Initiated At:</span> {new Date(instance.initiatedAt).toLocaleString()}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Assigned To:</span> {instance.assignedToName || 'Unassigned'}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Due Date:</span> {instance.dueDate ? new Date(instance.dueDate).toLocaleDateString() : '—'}
                            </p>
                        </div>
                        {instance.data && Object.keys(instance.data).length > 0 && (
                            <div className="sm:col-span-2">
                                <p className="text-xs font-semibold uppercase text-white-dark">Process Data</p>
                                <pre className="mt-1 overflow-x-auto rounded-md bg-[#f6f8fa] p-3 text-xs dark:bg-[#1b2e4b]">{JSON.stringify(instance.data, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'stages' && (
                    <div className="space-y-2">
                        {stages.map((stage) => (
                            <div
                                key={stage.id}
                                className={`flex items-center gap-3 rounded-lg border p-3 ${
                                    stage.id === instance?.currentStageId ? 'border-primary bg-primary-light dark:bg-primary/10' : 'border-white-light dark:border-white/10'
                                }`}
                            >
                                <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-success text-sm font-semibold text-white">{stage.orderNo}</span>
                                <div>
                                    <div className="flex items-center gap-2 font-semibold">
                                        {stage.name}
                                        {stage.id === instance?.currentStageId && <Badge variant="primary">Current</Badge>}
                                    </div>
                                    {stage.description && <p className="text-xs text-white-dark">{stage.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'timeline' && (
                    <div>
                        <p className="mb-4 text-sm text-white-dark">History of actions and events for this workflow instance</p>
                        {historyLoading ? (
                            <div className="flex min-h-[100px] items-center justify-center gap-2">
                                <Spinner className="h-5 w-5 text-primary" />
                                <span className="text-white-dark">Loading…</span>
                            </div>
                        ) : sortedHistory.length === 0 ? (
                            <p className="py-6 text-center text-white-dark">No history yet</p>
                        ) : (
                            <div className="space-y-4">
                                {sortedHistory.map((entry) => (
                                    <div key={entry.id} className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-content-center rounded-full bg-info-light text-info">
                                                {entry.fromStageId ? <IconClock className="h-4 w-4" /> : <IconFile className="h-4 w-4" />}
                                            </span>
                                            <div>
                                                <p className="font-semibold">{entry.fromStageId ? 'Stage Transition' : 'Instance Created'}</p>
                                                <p className="text-sm text-white-dark">
                                                    {entry.fromStageId ? `From ${entry.fromStageName} to ${entry.toStageName}` : entry.comment || 'Process started'}
                                                </p>
                                                {entry.fromStageId && (entry.transitionName || entry.comment) && (
                                                    <p className="text-xs text-white-dark">
                                                        {entry.transitionName}
                                                        {entry.comment ? ` — ${entry.comment}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-xs text-white-dark">{new Date(entry.performedAt).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowInstanceDetailPage;
