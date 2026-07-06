import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflows, fetchWorkflowDashboard, deleteWorkflow, clearWorkflowsError, Workflow } from '@/store/slices/workflows/workflowsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import DataGrid from '@/components/ui/DataGrid';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Breadcrumb from '@/components/ui/Breadcrumb';
import IconPlus from '@/components/Icon/IconPlus';
import IconListCheck from '@/components/Icon/IconListCheck';
import IconRouter from '@/components/Icon/IconRouter';
import IconChartSquare from '@/components/Icon/IconChartSquare';

const WorkflowsPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { workflows, workflowsLoading, workflowsError, dashboard, error } = useAppSelector((state) => state.workflows);

    const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchWorkflows());
        dispatch(fetchWorkflowDashboard());
    }, [dispatch]);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteWorkflow(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Workflow "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
            dispatch(fetchWorkflowDashboard());
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete workflow' }));
        } finally {
            setDeleting(false);
        }
    };

    const activePercent = dashboard && dashboard.totalWorkFlows > 0 ? Math.round((dashboard.activeWorkFlows / dashboard.totalWorkFlows) * 100) : 0;
    const complexityLabel = !dashboard ? '' : dashboard.averageStages <= 6 ? 'Workflow complexity is optimal' : 'Workflows are running deep — consider simplifying';

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">System Workflows Overview</h1>
                    <p className="text-white-dark">Manage and monitor all workflow definitions across the system</p>
                </div>
                <Button href="/dashboard/admin/workflows/create" className="btn-primary" variant="primary">
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Create New Workflow
                </Button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <Card>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white-dark">Total Workflows</span>
                        <span className="badge bg-primary-light text-primary">{dashboard?.activeWorkFlows ?? 0} active</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-content-center rounded-full bg-primary-light text-primary">
                            <IconListCheck className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-2xl font-bold">{dashboard?.totalWorkFlows ?? 0}</span>
                        <span className="text-white-dark">total workflows</span>
                    </div>
                    <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-white-dark">
                            <span>Active workflows</span>
                            <span>{activePercent}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white-light dark:bg-[#1b2e4b]">
                            <div className="h-full rounded-full bg-success" style={{ width: `${activePercent}%` }} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white-dark">Active Processes</span>
                    </div>
                    <p className="text-xs text-white-dark">Running process instances</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-content-center rounded-full bg-info-light text-info">
                            <IconRouter className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-2xl font-bold">{dashboard?.activeProcesses ?? 0}</span>
                        <span className="text-white-dark">active processes</span>
                    </div>
                    <p className="mt-3 text-xs text-primary">
                        <Link href="/dashboard/admin/workflows/processes">Click to view all processes</Link>
                    </p>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white-dark">Average Stages</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-content-center rounded-full bg-warning-light text-warning">
                            <IconChartSquare className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-2xl font-bold">{dashboard?.averageStages?.toFixed(1) ?? 0}</span>
                        <span className="text-white-dark">stages per workflow</span>
                    </div>
                    {dashboard && <p className="mt-3 text-xs text-white-dark">{complexityLabel}</p>}
                </Card>
            </div>

            {(error || workflowsError) && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearWorkflowsError())}>
                        {error || workflowsError}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-3"
                title="Workflows"
                count={workflows.length}
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: Workflow) => (
                            <RowActionsMenu onEdit={() => router.push(`/dashboard/admin/workflows/${row.id}/edit`)} onDelete={() => setDeleteTarget(row)} label={`Actions for ${row.name}`} />
                        ),
                    },
                    { header: 'Workflow Name', accessor: 'name' },
                    { header: 'Description', accessor: (row: Workflow) => row.description || '—' },
                    { header: 'Total Stages', accessor: 'totalStages' },
                    { header: 'Initial Stage', accessor: (row: Workflow) => row.initialStageName || '—' },
                    { header: 'Created By', accessor: (row: Workflow) => row.createdByName || '—' },
                    { header: 'Last Updated', accessor: (row: Workflow) => new Date(row.updatedAt).toLocaleDateString() },
                    {
                        header: 'Status',
                        accessor: (row: Workflow) => <Badge variant={row.active ? 'success' : 'secondary'}>{row.active ? 'Active' : 'Inactive'}</Badge>,
                    },
                ]}
                data={workflows}
                rowKey={(row) => row.id}
                searchKeys={['name', 'description']}
                searchPlaceholder="Search..."
                loading={workflowsLoading}
                emptyMessage="No workflows yet"
                onRefresh={() => dispatch(fetchWorkflows())}
            />

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Workflow"
                message={`Delete workflow "${deleteTarget?.name}"? This cannot be undone.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default WorkflowsPage;
