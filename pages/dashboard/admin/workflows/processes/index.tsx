import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflowInstances, fetchWorkflowInstanceDashboard, WorkflowInstance } from '@/store/slices/workflows/workflowInstancesSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Breadcrumb from '@/components/ui/Breadcrumb';
import IconBolt from '@/components/Icon/IconBolt';
import IconInfoCircle from '@/components/Icon/IconInfoCircle';
import IconCalendar from '@/components/Icon/IconCalendar';
import IconXCircle from '@/components/Icon/IconXCircle';

const statusBadgeVariant: Record<WorkflowInstance['status'], 'info' | 'warning' | 'success' | 'danger'> = {
    INITIATED: 'info',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    REJECTED: 'danger',
};

const priorityBadgeVariant: Record<WorkflowInstance['priority'], 'info' | 'warning' | 'danger'> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
};

const statusLabel = (status: WorkflowInstance['status']) =>
    status
        .toLowerCase()
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');

const dueDateLabel = (daysRemaining?: number) => {
    if (daysRemaining === undefined || daysRemaining === null) return null;
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days overdue`;
    if (daysRemaining === 0) return 'Due today';
    return `${daysRemaining} days remaining`;
};

const WorkflowProcessesPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { instances, loading, dashboard } = useAppSelector((state) => state.workflowInstances);

    useEffect(() => {
        dispatch(fetchWorkflowInstances());
        dispatch(fetchWorkflowInstanceDashboard());
    }, [dispatch]);

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3">
                <h1 className="text-xl font-bold">Workflow Instances</h1>
                <p className="text-white-dark">Active processes across the system</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active Processes" value={dashboard?.activeProcesses ?? 0} helperText="Currently running" icon={<IconBolt className="h-4 w-4" />} />
                <StatCard
                    label="High Priority"
                    value={dashboard?.highPriority ?? 0}
                    helperText="Require immediate attention"
                    icon={<IconInfoCircle className="h-4 w-4" />}
                    iconClassName="bg-danger-light text-danger"
                />
                <StatCard
                    label="Due This Week"
                    value={dashboard?.dueThisWeek ?? 0}
                    helperText="Approaching deadline"
                    icon={<IconCalendar className="h-4 w-4" />}
                    iconClassName="bg-warning-light text-warning"
                />
                <StatCard
                    label="Rejected"
                    value={dashboard?.rejected ?? 0}
                    helperText="Rejected processes"
                    icon={<IconXCircle className="h-4 w-4" />}
                    iconClassName="bg-secondary-light text-secondary"
                />
            </div>

            <DataGrid
                className="mt-3"
                title="Active Processes"
                count={instances.length}
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: WorkflowInstance) => (
                            <RowActionsMenu onView={() => router.push(`/dashboard/admin/workflows/processes/${row.id}`)} label={`Actions for ${row.processCode}`} />
                        ),
                    },
                    {
                        header: 'Process',
                        accessor: (row: WorkflowInstance) => (
                            <div>
                                <div className="font-semibold">{row.processName}</div>
                                <div className="text-xs text-white-dark">{row.processTypeKey}</div>
                            </div>
                        ),
                    },
                    {
                        header: 'Workflow',
                        accessor: (row: WorkflowInstance) => (
                            <div>
                                <div>{row.workFlowName}</div>
                                <div className="text-xs text-white-dark">{new Date(row.initiatedAt).toLocaleDateString()}</div>
                            </div>
                        ),
                    },
                    {
                        header: 'Current Stage',
                        accessor: (row: WorkflowInstance) => (
                            <div>
                                <div>{row.currentStageName}</div>
                                {row.currentStatusName && (
                                    <Badge variant={statusBadgeVariant[row.status]} className="mt-1">
                                        {row.currentStatusName}
                                    </Badge>
                                )}
                            </div>
                        ),
                    },
                    { header: 'Assigned To', accessor: (row: WorkflowInstance) => row.assignedToName || 'Unassigned' },
                    {
                        header: 'Priority',
                        accessor: (row: WorkflowInstance) => <Badge variant={priorityBadgeVariant[row.priority]}>{row.priority}</Badge>,
                    },
                    {
                        header: 'Due Date',
                        accessor: (row: WorkflowInstance) => (
                            <div>
                                {row.dueDate ? <div>{new Date(row.dueDate).toLocaleDateString()}</div> : <div className="text-white-dark">—</div>}
                                {dueDateLabel(row.daysRemaining) && <div className="text-xs text-white-dark">{dueDateLabel(row.daysRemaining)}</div>}
                            </div>
                        ),
                    },
                    {
                        header: 'Status',
                        accessor: (row: WorkflowInstance) => <Badge variant={statusBadgeVariant[row.status]}>{statusLabel(row.status)}</Badge>,
                    },
                ]}
                data={instances}
                rowKey={(row) => row.id}
                searchKeys={['processCode', 'processName', 'workFlowName']}
                searchPlaceholder="Search..."
                loading={loading}
                emptyMessage="No process instances yet"
                onRefresh={() => dispatch(fetchWorkflowInstances())}
            />
        </div>
    );
};

export default WorkflowProcessesPage;
