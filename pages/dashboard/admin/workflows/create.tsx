import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createWorkflow, updateWorkflow, WorkflowPayload } from '@/store/slices/workflows/workflowsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import WorkflowStagesManager from '@/components/workflow/WorkflowStagesManager';
import WorkflowTransitionsManager from '@/components/workflow/WorkflowTransitionsManager';
import WorkflowMappingsManager from '@/components/workflow/WorkflowMappingsManager';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

type StepKey = 1 | 2 | 3 | 4 | 5;

const STEPS: { key: StepKey; label: string }[] = [
    { key: 1, label: 'Core Components' },
    { key: 2, label: 'Stage Structure' },
    { key: 3, label: 'Connect Components' },
    { key: 4, label: 'Module Mappings' },
    { key: 5, label: 'Summary' },
];

const emptyForm: WorkflowPayload = { name: '', description: '', active: true };

const CreateWorkflowPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { saving } = useAppSelector((state) => state.workflows);
    const { stages } = useAppSelector((state) => state.workflowStages);
    const { transitions } = useAppSelector((state) => state.workflowTransitions);
    const { mappings } = useAppSelector((state) => state.workflowMappings);

    const [step, setStep] = useState<StepKey>(1);
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [form, setForm] = useState<WorkflowPayload>(emptyForm);

    const maxUnlockedStep: StepKey = workflowId ? 5 : 1;
    const workflowMappings = workflowId ? mappings.filter((mapping) => mapping.workFlowId === workflowId) : [];

    const goToStep = (target: StepKey) => {
        if (target <= maxUnlockedStep) setStep(target);
    };

    const submitCoreComponents = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (workflowId) {
                await dispatch(updateWorkflow({ id: workflowId, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Workflow "${form.name}" updated` }));
            } else {
                const created = await dispatch(createWorkflow(form)).unwrap();
                setWorkflowId(created.id);
                dispatch(showToast({ variant: 'success', message: `Workflow "${form.name}" created successfully` }));
            }
            setStep(2);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save workflow' }));
        }
    };

    const finish = () => {
        dispatch(showToast({ variant: 'success', message: 'Workflow setup complete' }));
        router.push('/dashboard/admin/workflows');
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] flex-col">
            <div className="shrink-0">
                <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Workflows', href: '/dashboard/admin/workflows' }, { label: 'Create' }]} />

                <div className="mt-3">
                    <h1 className="text-xl font-bold">Create Workflow</h1>
                    <p className="text-white-dark">Follow the steps below to create a new workflow.</p>
                </div>

                <div className="panel mt-4 !p-3">
                    <div className="flex items-center">
                        {STEPS.map((item, index) => (
                            <div key={item.key} className="flex flex-1 items-center last:flex-none">
                                <button
                                    type="button"
                                    onClick={() => goToStep(item.key)}
                                    disabled={item.key > maxUnlockedStep}
                                    className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
                                >
                                    <span
                                        className={`grid h-9 w-9 place-content-center rounded-full text-sm font-semibold transition-colors ${
                                            step === item.key
                                                ? 'bg-primary text-white'
                                                : item.key < step || (item.key === 1 && workflowId)
                                                ? 'bg-success text-white'
                                                : 'bg-[#ebedf2] text-white-dark dark:bg-[#1b2e4b]'
                                        }`}
                                    >
                                        {item.key < step ? <IconCircleCheck className="h-5 w-5" /> : item.key}
                                    </span>
                                    <span className={`whitespace-nowrap text-xs font-semibold ${step === item.key ? 'text-primary' : 'text-white-dark'}`}>{item.label}</span>
                                </button>
                                {index < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${item.key < step ? 'bg-success' : 'bg-[#ebedf2] dark:bg-[#1b2e4b]'}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="panel mt-4 min-h-0 flex-1 overflow-y-auto">
                {step === 1 && (
                    <div>
                        <p className="text-sm font-semibold text-white-dark">Core Components</p>
                        <h5 className="mt-1 text-lg font-semibold">{workflowId ? 'Workflow Details' : 'Create Workflow'}</h5>
                        <p className="mt-1 text-sm text-white-dark">Define workflow details (e.g., name: &quot;Document Approval&quot;, active: true)</p>

                        <form onSubmit={submitCoreComponents} className="mt-4 max-w-lg space-y-4">
                            <Input
                                id="name"
                                label="Workflow Name"
                                value={form.name}
                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Document Approval"
                                required
                            />
                            <Textarea
                                id="description"
                                label="Description"
                                rows={4}
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe the purpose of this workflow"
                            />
                            <Checkbox id="active" label="Active" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />

                            <Button type="submit" variant="primary" disabled={saving}>
                                {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                {saving ? 'Saving…' : workflowId ? 'Save & Continue' : 'Create Workflow'}
                            </Button>
                        </form>
                    </div>
                )}

                {step === 2 && workflowId && (
                    <div>
                        <WorkflowStagesManager workFlowId={workflowId} />
                        <div className="mt-5 flex items-center justify-between border-t border-white-light pt-4 dark:border-white/10">
                            <Button variant="outline-primary" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            <Button onClick={() => setStep(3)} disabled={stages.length === 0}>
                                Next: Connect Components
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && workflowId && (
                    <div>
                        <WorkflowTransitionsManager workFlowId={workflowId} />
                        <div className="mt-5 flex items-center justify-between border-t border-white-light pt-4 dark:border-white/10">
                            <Button variant="outline-primary" onClick={() => setStep(2)}>
                                Back
                            </Button>
                            <Button onClick={() => setStep(4)}>Next: Module Mappings</Button>
                        </div>
                    </div>
                )}

                {step === 4 && workflowId && (
                    <div>
                        <WorkflowMappingsManager workFlowId={workflowId} />
                        <p className="mt-3 text-xs text-warning">
                            No calling module can start a process on this workflow until at least one mapping is added — you can also add one later from Edit Workflow.
                        </p>
                        <div className="mt-5 flex items-center justify-between border-t border-white-light pt-4 dark:border-white/10">
                            <Button variant="outline-primary" onClick={() => setStep(3)}>
                                Back
                            </Button>
                            <Button onClick={() => setStep(5)}>Next: Summary</Button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div>
                        <h5 className="text-lg font-semibold">Summary</h5>
                        <p className="mt-1 text-sm text-white-dark">Review your workflow before finishing.</p>

                        <div className="mt-4 space-y-4">
                            <div className="rounded-lg border border-white-light p-3 dark:border-white/10">
                                <p className="text-xs font-semibold uppercase text-white-dark">Workflow</p>
                                <p className="mt-1 font-semibold">{form.name}</p>
                                <p className="text-sm text-white-dark">{form.description || 'No description'}</p>
                            </div>

                            <div className="rounded-lg border border-white-light p-3 dark:border-white/10">
                                <p className="text-xs font-semibold uppercase text-white-dark">Stages ({stages.length})</p>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {stages.map((stage) => (
                                        <li key={stage.id}>
                                            {stage.orderNo}. {stage.name}
                                            {stage.isInitial && ' (Initial)'}
                                            {stage.isFinal && ' (Final)'}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-lg border border-white-light p-3 dark:border-white/10">
                                <p className="text-xs font-semibold uppercase text-white-dark">Transitions ({transitions.length})</p>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {transitions.map((transition) => (
                                        <li key={transition.id}>
                                            {transition.fromStageName} — {transition.name} → {transition.toStageName}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-lg border border-white-light p-3 dark:border-white/10">
                                <p className="text-xs font-semibold uppercase text-white-dark">Module Mappings ({workflowMappings.length})</p>
                                {workflowMappings.length === 0 ? (
                                    <p className="mt-2 text-sm text-warning">None yet — no module can start a process on this workflow until one is added.</p>
                                ) : (
                                    <ul className="mt-2 space-y-1 text-sm">
                                        {workflowMappings.map((mapping) => (
                                            <li key={mapping.id}>
                                                {mapping.processTypeKey} {mapping.active ? '' : '(inactive)'}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-white-light pt-4 dark:border-white/10">
                            <Button variant="outline-primary" onClick={() => setStep(4)}>
                                Back
                            </Button>
                            <Button variant="success" onClick={finish}>
                                Finish
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateWorkflowPage;
