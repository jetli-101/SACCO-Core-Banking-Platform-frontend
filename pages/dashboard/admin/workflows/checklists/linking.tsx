import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflows } from '@/store/slices/workflows/workflowsSlice';
import {
    fetchChecklists,
    fetchWorkflowChecklistLinks,
    fetchChecklistAnalytics,
    linkChecklistToStage,
    unlinkChecklistFromStage,
} from '@/store/slices/workflows/checklistsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import IconCaretDown from '@/components/Icon/IconCaretDown';
import IconLink from '@/components/Icon/IconLink';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconListCheck from '@/components/Icon/IconListCheck';
import IconChartSquare from '@/components/Icon/IconChartSquare';
import IconX from '@/components/Icon/IconX';

type TabKey = 'checklists' | 'analytics';

const WorkflowChecklistLinkingPage = () => {
    const dispatch = useAppDispatch();
    const { workflows } = useAppSelector((state) => state.workflows);
    const { checklists, workflowLinks, workflowLinksLoading, analytics, analyticsLoading, linking } = useAppSelector((state) => state.checklists);

    const [tab, setTab] = useState<TabKey>('checklists');
    const [workflowId, setWorkflowId] = useState('');
    const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
    const [pickerStageId, setPickerStageId] = useState<string | null>(null);
    const [pickerChecklistId, setPickerChecklistId] = useState('');

    useEffect(() => {
        dispatch(fetchWorkflows());
        dispatch(fetchChecklists());
    }, [dispatch]);

    useEffect(() => {
        if (!workflowId && workflows.length > 0) setWorkflowId(workflows[0].id);
    }, [workflows, workflowId]);

    useEffect(() => {
        if (workflowId && tab === 'checklists') dispatch(fetchWorkflowChecklistLinks(workflowId));
    }, [dispatch, workflowId, tab]);

    useEffect(() => {
        if (tab === 'analytics') dispatch(fetchChecklistAnalytics());
    }, [dispatch, tab]);

    const selectedWorkflow = useMemo(() => workflows.find((workflow) => workflow.id === workflowId) || null, [workflows, workflowId]);

    const toggleStage = (stageId: string) => setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));

    const openPicker = (stageId: string) => {
        setPickerStageId(stageId);
        setPickerChecklistId('');
    };

    const submitLink = async (stageId: string) => {
        if (!pickerChecklistId) return;
        try {
            await dispatch(linkChecklistToStage({ checklistId: pickerChecklistId, stageId })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Checklist linked to stage' }));
            setPickerStageId(null);
            if (workflowId) dispatch(fetchWorkflowChecklistLinks(workflowId));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to link checklist' }));
        }
    };

    const unlink = async (checklistId: string, stageId: string) => {
        try {
            await dispatch(unlinkChecklistFromStage({ checklistId, stageId })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Checklist unlinked from stage' }));
            if (workflowId) dispatch(fetchWorkflowChecklistLinks(workflowId));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to unlink checklist' }));
        }
    };

    const maxWorkflowItems = Math.max(1, ...(analytics?.perWorkflow.map((row) => row.itemCount) || [1]));

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Workflow Checklist Linking</h1>
                    <p className="text-white-dark">Link reusable checklists to the stages that should require them, and see coverage across every workflow</p>
                </div>
                <Button variant="outline-primary" href="/dashboard/admin/workflows/checklists">
                    <IconListCheck className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Manage Checklists
                </Button>
            </div>

            <div className="panel mt-3">
                <Tabs
                    variant="boxed"
                    active={tab}
                    onChange={(key) => setTab(key as TabKey)}
                    items={[
                        { key: 'checklists', label: 'Checklists' },
                        { key: 'analytics', label: 'Analytics' },
                    ]}
                />

                {tab === 'checklists' ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div>
                            <div className="font-semibold">Workflows</div>
                            <ul className="mt-2 space-y-1">
                                {workflows.map((workflow) => (
                                    <li key={workflow.id}>
                                        <button
                                            type="button"
                                            onClick={() => setWorkflowId(workflow.id)}
                                            className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                                workflowId === workflow.id
                                                    ? 'bg-primary font-semibold text-white'
                                                    : 'text-dark hover:bg-primary-light hover:text-primary dark:text-white-light dark:hover:bg-primary/20'
                                            }`}
                                        >
                                            <span className="truncate">{workflow.name}</span>
                                            <span className={`text-xs ${workflowId === workflow.id ? 'text-white/80' : 'text-white-dark'}`}>{workflow.totalStages} stages</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-5 font-semibold">Checklists</div>
                            <ul className="mt-2 space-y-1">
                                {checklists.map((checklist) => (
                                    <li key={checklist.id} className="rounded-md px-3 py-1.5 text-sm text-white-dark">
                                        {checklist.name}
                                    </li>
                                ))}
                                {checklists.length === 0 && <li className="px-3 py-1.5 text-sm text-white-dark">No checklists created yet.</li>}
                            </ul>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold">{selectedWorkflow ? selectedWorkflow.name : 'Select a workflow'}</div>
                                {workflowId && (
                                    <Button size="sm" variant="outline-primary" onClick={() => dispatch(fetchWorkflowChecklistLinks(workflowId))}>
                                        <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                                        Refresh
                                    </Button>
                                )}
                            </div>

                            {workflowLinksLoading ? (
                                <div className="flex min-h-[150px] items-center justify-center gap-2">
                                    <Spinner className="h-5 w-5 text-primary" />
                                </div>
                            ) : (
                                <ul className="mt-3 space-y-2">
                                    {workflowLinks.map((stage) => (
                                        <li key={stage.stageId} className="rounded-lg border border-white-light dark:border-white/10">
                                            <button
                                                type="button"
                                                onClick={() => toggleStage(stage.stageId)}
                                                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <IconCaretDown className={`h-4 w-4 transition-transform ${expandedStages[stage.stageId] ? 'rotate-180' : '-rotate-90'}`} />
                                                    <span className="font-semibold">
                                                        {stage.orderNo}. {stage.stageName}
                                                    </span>
                                                </span>
                                                <span className="flex items-center gap-2 text-white-dark">
                                                    {stage.checklists.length} checklist{stage.checklists.length === 1 ? '' : 's'}
                                                    <IconLink className="h-4 w-4" />
                                                </span>
                                            </button>

                                            {expandedStages[stage.stageId] && (
                                                <div className="border-t border-white-light px-4 py-3 dark:border-white/10">
                                                    {stage.checklists.length === 0 ? (
                                                        <p className="text-xs text-white-dark">No checklists linked to this stage yet.</p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {stage.checklists.map((checklist) => (
                                                                <Badge key={checklist.id} variant="secondary" outline className="!flex items-center gap-1.5">
                                                                    {checklist.name} · {checklist.itemCount} item{checklist.itemCount === 1 ? '' : 's'}
                                                                    <button type="button" onClick={() => unlink(checklist.id, stage.stageId)} aria-label={`Unlink ${checklist.name}`}>
                                                                        <IconX className="h-3 w-3" />
                                                                    </button>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {pickerStageId === stage.stageId ? (
                                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                                            <select className="form-select form-input-sm w-auto" value={pickerChecklistId} onChange={(e) => setPickerChecklistId(e.target.value)}>
                                                                <option value="">Select a checklist…</option>
                                                                {checklists
                                                                    .filter((checklist) => !stage.checklists.some((linked) => linked.id === checklist.id))
                                                                    .map((checklist) => (
                                                                        <option key={checklist.id} value={checklist.id}>
                                                                            {checklist.name}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                            <Button size="sm" onClick={() => submitLink(stage.stageId)} disabled={!pickerChecklistId || linking}>
                                                                {linking && <Spinner className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />}
                                                                Link
                                                            </Button>
                                                            <Button size="sm" variant="outline-primary" onClick={() => setPickerStageId(null)}>
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button size="sm" variant="outline-primary" className="mt-3" onClick={() => openPicker(stage.stageId)}>
                                                            <IconLink className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                                                            Link a checklist
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                    {workflowId && workflowLinks.length === 0 && <p className="text-sm text-white-dark">This workflow has no stages yet.</p>}
                                </ul>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        {analyticsLoading || !analytics ? (
                            <div className="flex min-h-[200px] items-center justify-center gap-2">
                                <Spinner className="h-5 w-5 text-primary" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-md bg-[#f6f8fa] p-3 dark:bg-[#1b2e4b]">
                                        <div className="text-xs font-semibold uppercase text-white-dark">Total Workflows</div>
                                        <div className="mt-1 text-xl font-bold">{analytics.totalWorkflows}</div>
                                    </div>
                                    <div className="rounded-md bg-[#f6f8fa] p-3 dark:bg-[#1b2e4b]">
                                        <div className="text-xs font-semibold uppercase text-white-dark">Total Stages</div>
                                        <div className="mt-1 text-xl font-bold">{analytics.totalStages}</div>
                                    </div>
                                    <div className="rounded-md bg-[#f6f8fa] p-3 dark:bg-[#1b2e4b]">
                                        <div className="text-xs font-semibold uppercase text-white-dark">Total Checklists</div>
                                        <div className="mt-1 text-xl font-bold">{analytics.totalChecklists}</div>
                                    </div>
                                    <div className="rounded-md bg-[#f6f8fa] p-3 dark:bg-[#1b2e4b]">
                                        <div className="text-xs font-semibold uppercase text-white-dark">Checklist Items</div>
                                        <div className="mt-1 text-xl font-bold">
                                            {analytics.totalChecklistItems} <span className="text-sm font-normal text-white-dark">({analytics.totalMandatoryItems} mandatory)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center gap-1.5 font-semibold">
                                    <IconChartSquare className="h-4.5 w-4.5" />
                                    Checklists per Workflow
                                </div>
                                <div className="mt-3 space-y-4">
                                    {analytics.perWorkflow.map((row) => (
                                        <div key={row.workFlowId}>
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                                <span className="font-semibold">{row.workFlowName}</span>
                                                <span className="text-white-dark">
                                                    {row.checklistCount} checklist{row.checklistCount === 1 ? '' : 's'} / {row.itemCount} item{row.itemCount === 1 ? '' : 's'}
                                                </span>
                                            </div>
                                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#ebedf2] dark:bg-white/10">
                                                <div className="h-full rounded-full bg-primary" style={{ width: `${(row.itemCount / maxWorkflowItems) * 100}%` }} />
                                            </div>
                                            <div className="mt-1 flex justify-between text-xs text-white-dark">
                                                <span>Mandatory: {row.mandatoryCount}</span>
                                                <span>Optional: {row.optionalCount}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {analytics.perWorkflow.length === 0 && <p className="text-sm text-white-dark">No workflows yet.</p>}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowChecklistLinkingPage;
