import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflowById } from '@/store/slices/workflows/workflowsSlice';
import { fetchWorkflowStages } from '@/store/slices/workflows/workflowStagesSlice';
import { fetchWorkflowTransitions } from '@/store/slices/workflows/workflowTransitionsSlice';
import { fetchWorkflowMappings } from '@/store/slices/workflows/workflowMappingsSlice';
import { fetchWorkflowInstances } from '@/store/slices/workflows/workflowInstancesSlice';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import DataGrid from '@/components/ui/DataGrid';
import SimpleBarChart from '@/components/dashboard/charts/SimpleBarChart';
import { CHART_COLORS } from '@/components/dashboard/charts/chartColors';
import WorkflowVisualization from '@/components/workflow/WorkflowVisualization';

interface ViewWorkflowModalProps {
    workflowId: string | null;
    onClose: () => void;
}

type TabKey = 'overview' | 'stages' | 'processes' | 'visualization';

const statusBadgeVariant: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    INITIATED: 'info',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    REJECTED: 'danger',
};

// Read-only "View Workflow" dialog — an at-a-glance summary (details, usage, stage
// distribution) distinct from the full Edit Workflow page, which is where stages and
// transitions actually get changed.
const ViewWorkflowModal = ({ workflowId, onClose }: ViewWorkflowModalProps) => {
    const dispatch = useAppDispatch();
    const [tab, setTab] = useState<TabKey>('overview');

    const { workflows } = useAppSelector((state) => state.workflows);
    const { stages } = useAppSelector((state) => state.workflowStages);
    const { transitions } = useAppSelector((state) => state.workflowTransitions);
    const { mappings } = useAppSelector((state) => state.workflowMappings);
    const { instances } = useAppSelector((state) => state.workflowInstances);

    const workflow = workflows.find((item) => item.id === workflowId);

    useEffect(() => {
        if (!workflowId) return;
        setTab('overview');
        dispatch(fetchWorkflowById(workflowId));
        dispatch(fetchWorkflowStages(workflowId));
        dispatch(fetchWorkflowTransitions(workflowId));
        dispatch(fetchWorkflowMappings());
        dispatch(fetchWorkflowInstances());
    }, [dispatch, workflowId]);

    const workflowInstances = useMemo(() => instances.filter((instance) => instance.workFlowId === workflowId), [instances, workflowId]);
    const usedInModules = useMemo(
        () => Array.from(new Set(mappings.filter((mapping) => mapping.workFlowId === workflowId).map((mapping) => mapping.processTypeKey))),
        [mappings, workflowId]
    );

    const completedInstances = workflowInstances.filter((instance) => instance.status === 'COMPLETED');
    const completionRate = workflowInstances.length > 0 ? Math.round((completedInstances.length / workflowInstances.length) * 100) : null;
    const avgCompletionDays =
        completedInstances.length > 0
            ? completedInstances.reduce((sum, instance) => sum + (new Date(instance.updatedAt).getTime() - new Date(instance.initiatedAt).getTime()), 0) /
              completedInstances.length /
              (1000 * 60 * 60 * 24)
            : null;

    const stageDistribution = useMemo(
        () =>
            stages.map((stage) => ({
                stage: stage.name,
                count: workflowInstances.filter((instance) => instance.currentStageId === stage.id).length,
            })),
        [stages, workflowInstances]
    );

    const tabItems = useMemo(
        () => [
            { key: 'overview', label: 'Overview' },
            { key: 'stages', label: 'Stages' },
            { key: 'processes', label: 'Used In Processes' },
            { key: 'visualization', label: 'Visualization' },
        ],
        []
    );

    if (!workflowId) return null;

    return (
        <Modal
            isOpen={!!workflowId}
            onClose={onClose}
            size="xl"
            title={
                <div>
                    <div className="flex items-center gap-2">
                        <span>{workflow?.name || '…'}</span>
                        {workflow && <Badge variant={workflow.active ? 'success' : 'secondary'}>{workflow.active ? 'Active' : 'Inactive'}</Badge>}
                    </div>
                    {workflow?.description && <p className="mt-0.5 text-xs font-normal text-white-dark">{workflow.description}</p>}
                </div>
            }
        >
            <Tabs items={tabItems} active={tab} onChange={(key) => setTab(key as TabKey)} />

            {tab === 'overview' && workflow && (
                <div className="space-y-4">
                    <div className="rounded-lg border border-white-light p-3 dark:border-white/10">
                        <p className="mb-2 text-xs font-semibold uppercase text-white-dark">Workflow Details</p>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                            <p>
                                <span className="text-white-dark">Created By:</span> {workflow.createdByName || '—'}
                            </p>
                            <p>
                                <span className="text-white-dark">Created On:</span> {new Date(workflow.createdAt).toLocaleDateString()}
                            </p>
                            <p>
                                <span className="text-white-dark">Last Updated:</span> {new Date(workflow.updatedAt).toLocaleDateString()}
                            </p>
                            <p>
                                <span className="text-white-dark">Total Stages:</span> {workflow.totalStages}
                            </p>
                            <p>
                                <span className="text-white-dark">Initial Stage:</span> {workflow.initialStageName || '—'}
                            </p>
                            <p>
                                <span className="text-white-dark">Status:</span> {workflow.active ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-white-light p-3 dark:border-white/10">
                        <p className="mb-2 text-xs font-semibold uppercase text-white-dark">Usage Statistics</p>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                            <p>
                                <span className="text-white-dark">Used in Modules:</span> {usedInModules.length > 0 ? usedInModules.join(', ') : 'Not yet used'}
                            </p>
                            <p>
                                <span className="text-white-dark">Active Processes:</span> {workflowInstances.length}
                            </p>
                            <p>
                                <span className="text-white-dark">Avg Completion Time:</span> {avgCompletionDays !== null ? `${avgCompletionDays.toFixed(1)} days` : '—'}
                            </p>
                            <p>
                                <span className="text-white-dark">Completion Rate:</span> {completionRate !== null ? `${completionRate}%` : '—'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-white-dark">Current Stage Distribution</p>
                        {stages.length > 0 ? (
                            <SimpleBarChart data={stageDistribution} xKey="stage" dataKey="count" color={CHART_COLORS.primary} height={220} />
                        ) : (
                            <p className="text-sm text-white-dark">Add stages to see distribution.</p>
                        )}
                    </div>
                </div>
            )}

            {tab === 'stages' && (
                <div className="space-y-2">
                    {stages.length === 0 && <p className="py-6 text-center text-white-dark">No stages yet</p>}
                    {stages.map((stage) => (
                        <div key={stage.id} className="flex items-center gap-3 rounded-lg border border-white-light p-3 dark:border-white/10">
                            <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-success text-sm font-semibold text-white">{stage.orderNo}</span>
                            <div>
                                <div className="flex items-center gap-2 font-semibold">
                                    {stage.name}
                                    {stage.isInitial && <Badge variant="info">Initial</Badge>}
                                    {stage.isFinal && <Badge variant="warning">Final</Badge>}
                                </div>
                                {stage.description && <p className="text-xs text-white-dark">{stage.description}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'processes' && (
                <DataGrid
                    panel={false}
                    title="Processes"
                    count={workflowInstances.length}
                    exportable
                    columns={[
                        { header: 'Process', accessor: (row) => row.processName },
                        { header: 'Current Stage', accessor: (row) => row.currentStageName },
                        {
                            header: 'Status',
                            accessor: (row) => <Badge variant={statusBadgeVariant[row.status]}>{row.currentStatusName || row.status}</Badge>,
                        },
                        { header: 'Assigned To', accessor: (row) => row.assignedToName || 'Unassigned' },
                    ]}
                    data={workflowInstances}
                    rowKey={(row) => row.id}
                    searchKeys={['processName', 'currentStageName']}
                    emptyMessage="This workflow hasn't been used by any process yet"
                />
            )}

            {tab === 'visualization' && <WorkflowVisualization stages={stages} transitions={transitions} />}
        </Modal>
    );
};

export default ViewWorkflowModal;
