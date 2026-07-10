import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflowById, updateWorkflow, WorkflowPayload } from '@/store/slices/workflows/workflowsSlice';
import { fetchWorkflowStages } from '@/store/slices/workflows/workflowStagesSlice';
import { fetchWorkflowTransitions } from '@/store/slices/workflows/workflowTransitionsSlice';
import { fetchRoles } from '@/store/slices/roles/rolesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import Tabs from '@/components/ui/Tabs';
import WorkflowStagesManager from '@/components/workflow/WorkflowStagesManager';
import WorkflowTransitionsManager from '@/components/workflow/WorkflowTransitionsManager';
import WorkflowMappingsManager from '@/components/workflow/WorkflowMappingsManager';
import WorkflowVisualization from '@/components/workflow/WorkflowVisualization';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';

type TabKey = 'details' | 'stages' | 'transitions' | 'visualization';

const EditWorkflowPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const id = typeof router.query.id === 'string' ? router.query.id : '';
    const initialTab = typeof router.query.tab === 'string' ? (router.query.tab as TabKey) : 'details';

    const { workflows, saving } = useAppSelector((state) => state.workflows);
    const { stages } = useAppSelector((state) => state.workflowStages);
    const { transitions } = useAppSelector((state) => state.workflowTransitions);
    const { roles } = useAppSelector((state) => state.roles);
    const workflow = workflows.find((item) => item.id === id);

    const [tab, setTab] = useState<TabKey>(initialTab);
    const [form, setForm] = useState<WorkflowPayload>({ name: '', description: '', active: true, allowedRoleIds: [] });

    useEffect(() => {
        if (!id) return;
        dispatch(fetchWorkflowById(id));
        dispatch(fetchWorkflowStages(id));
        dispatch(fetchWorkflowTransitions(id));
        dispatch(fetchRoles());
    }, [dispatch, id]);

    useEffect(() => {
        if (workflow) setForm({ name: workflow.name, description: workflow.description || '', active: workflow.active, allowedRoleIds: workflow.allowedRoleIds || [] });
    }, [workflow]);

    const toggleAllowedRole = (roleId: string) => {
        setForm((prev) => {
            const current = prev.allowedRoleIds || [];
            const next = current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId];
            return { ...prev, allowedRoleIds: next };
        });
    };

    const grantableRoles = roles.filter((role) => role.name !== 'ROLE_SYSTEM_ADMINISTRATOR');

    const saveDetails = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await dispatch(updateWorkflow({ id, payload: form })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Workflow details updated' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update workflow' }));
        }
    };

    const tabItems = useMemo(
        () => [
            { key: 'details', label: 'Workflow Details' },
            { key: 'stages', label: 'Stages' },
            { key: 'transitions', label: 'Transitions' },
            { key: 'visualization', label: 'Visualization' },
        ],
        []
    );

    return (
        <div>
            <Breadcrumb trailingLabel={workflow?.name} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">
                        Edit Workflow: <span className="text-primary">{workflow?.name || '…'}</span>
                    </h1>
                    <p className="text-white-dark">Manage workflow details, stages, transitions, and visualization</p>
                </div>
                <Button variant="outline-primary" href="/dashboard/admin/workflows">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to Workflows
                </Button>
            </div>

            <div className="panel mt-3">
                <Tabs items={tabItems} active={tab} onChange={(key) => setTab(key as TabKey)} />

                {tab === 'details' && (
                    <div className="space-y-6">
                        <form onSubmit={saveDetails} className="max-w-lg space-y-4">
                            <Input id="name" label="Workflow Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                            <Textarea id="description" label="Description" rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
                            <Checkbox id="active" label="Active" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />

                            <div className="w-full">
                                <span className="mb-1.5 block text-sm font-semibold">Visible To</span>
                                <p className="mb-2 text-xs text-white-dark">
                                    System Administrators can always see and configure every workflow. Grant additional roles here if this specific workflow should also be visible/editable to them —
                                    e.g. Branch Managers owning the Loan Application Approval workflow.
                                </p>
                                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-white-light p-2 dark:border-white/10">
                                    {grantableRoles.length === 0 ? (
                                        <p className="p-1 text-sm text-white-dark">No other roles yet</p>
                                    ) : (
                                        grantableRoles.map((role) => (
                                            <Checkbox key={role.id} checked={(form.allowedRoleIds || []).includes(role.id)} onChange={() => toggleAllowedRole(role.id)} label={role.name} />
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={saving}>
                                    {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>

                        {workflow && (
                            <div className="border-t border-white-light pt-6 dark:border-white/10">
                                <h5 className="mb-3 text-lg font-semibold">Workflow Summary</h5>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    <div>
                                        <div className="text-xs font-semibold uppercase text-white-dark">Total Stages</div>
                                        <div className="mt-0.5 text-xl font-bold">{workflow.totalStages}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase text-white-dark">Total Transitions</div>
                                        <div className="mt-0.5 text-xl font-bold">{transitions.length}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase text-white-dark">Created By</div>
                                        <div className="mt-0.5 text-sm font-semibold">{workflow.createdByName || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase text-white-dark">Last Updated</div>
                                        <div className="mt-0.5 text-sm font-semibold">{new Date(workflow.updatedAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'stages' && id && <WorkflowStagesManager workFlowId={id} />}

                {tab === 'transitions' && id && (
                    <div className="space-y-6">
                        <WorkflowTransitionsManager workFlowId={id} />
                        <div className="border-t border-white-light pt-6 dark:border-white/10">
                            <WorkflowMappingsManager workFlowId={id} />
                        </div>
                    </div>
                )}

                {tab === 'visualization' && (
                    <div>
                        <p className="mb-4 text-sm text-white-dark">A generated view of how stages connect — arcs above the line move a process forward, arcs below move it back.</p>
                        <WorkflowVisualization stages={stages} transitions={transitions} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditWorkflowPage;
