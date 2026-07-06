import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflowById, updateWorkflow, WorkflowPayload } from '@/store/slices/workflows/workflowsSlice';
import { fetchWorkflowStages } from '@/store/slices/workflows/workflowStagesSlice';
import { fetchWorkflowTransitions } from '@/store/slices/workflows/workflowTransitionsSlice';
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
    const workflow = workflows.find((item) => item.id === id);

    const [tab, setTab] = useState<TabKey>(initialTab);
    const [form, setForm] = useState<WorkflowPayload>({ name: '', description: '', active: true });

    useEffect(() => {
        if (!id) return;
        dispatch(fetchWorkflowById(id));
        dispatch(fetchWorkflowStages(id));
        dispatch(fetchWorkflowTransitions(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (workflow) setForm({ name: workflow.name, description: workflow.description || '', active: workflow.active });
    }, [workflow]);

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
                    <form onSubmit={saveDetails} className="max-w-lg space-y-4">
                        <Input id="name" label="Workflow Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                        <Textarea id="description" label="Description" rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
                        <Checkbox id="active" label="Active" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={saving}>
                                {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                )}

                {tab === 'stages' && id && <WorkflowStagesManager workFlowId={id} />}

                {tab === 'transitions' && id && <WorkflowTransitionsManager workFlowId={id} />}

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
