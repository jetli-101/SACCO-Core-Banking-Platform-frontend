import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, WORKFLOW_ENDPOINTS, WORKFLOW_STAGE_ENDPOINTS } from '@/urlhelper';
import { Workflow } from '@/store/slices/workflows/workflowsSlice';
import { WorkflowStage } from '@/store/slices/workflows/workflowStagesSlice';
import { getWorkflowInterfaceOptions } from '@/pages/pages/interfaceRegistry';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import IconLayoutGrid from '@/components/Icon/IconLayoutGrid';
import IconCode from '@/components/Icon/IconCode';
import IconLink from '@/components/Icon/IconLink';
import IconRouter from '@/components/Icon/IconRouter';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

interface BackendEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface StageUsage {
    workflowId: string;
    workflowName: string;
    stageId: string;
    stageName: string;
    interfaceKey?: string;
}

const GENERIC_FALLBACK_KEY = '__GENERIC_FALLBACK__';

const InterfaceRegistryPage = () => {
    const [stages, setStages] = useState<StageUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKey, setSelectedKey] = useState<string>('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const workflowsRes = await apiGet<BackendEnvelope<Workflow[]>>(WORKFLOW_ENDPOINTS.ALL);
            const perWorkflow = await Promise.all(
                workflowsRes.data.map(async (workflow) => {
                    const stagesRes = await apiGet<BackendEnvelope<WorkflowStage[]>>(WORKFLOW_STAGE_ENDPOINTS.ALL(workflow.id));
                    return stagesRes.data.map((stage) => ({
                        workflowId: workflow.id,
                        workflowName: workflow.name,
                        stageId: stage.id,
                        stageName: stage.name,
                        interfaceKey: stage.interfaceKey,
                    }));
                })
            );
            if (!cancelled) {
                setStages(perWorkflow.flat());
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const registryEntries = useMemo(() => getWorkflowInterfaceOptions(), []);
    const registeredKeys = useMemo(() => new Set(registryEntries.map((entry) => entry.value)), [registryEntries]);

    const usageByKey = useMemo(() => {
        const map: Record<string, StageUsage[]> = {};
        stages.forEach((stage) => {
            if (!stage.interfaceKey) return;
            (map[stage.interfaceKey] ||= []).push(stage);
        });
        return map;
    }, [stages]);

    const orphanedUsages = useMemo(() => stages.filter((stage) => stage.interfaceKey && !registeredKeys.has(stage.interfaceKey)), [stages, registeredKeys]);
    const fallbackUsages = useMemo(() => stages.filter((stage) => !stage.interfaceKey), [stages]);
    const wiredCount = stages.length - fallbackUsages.length - orphanedUsages.length;

    // The selectable list = every registered interface plus the built-in generic fallback,
    // so "which stages use this" is answerable for every screen a stage could resolve to.
    const panelEntries = useMemo(
        () => [
            ...registryEntries.map((entry) => ({ key: entry.value, label: entry.label, description: entry.description, path: entry.path, usages: usageByKey[entry.value] || [] })),
            {
                key: GENERIC_FALLBACK_KEY,
                label: 'Generic Action Panel',
                description:
                    'Built-in fallback. Renders raw stage data with transition buttons, checklist, comment box, and forward-to-person — used automatically whenever a stage has no interface configured.',
                path: '@/components/workflow/DefaultStageActionPanel',
                usages: fallbackUsages,
            },
        ],
        [registryEntries, usageByKey, fallbackUsages]
    );

    useEffect(() => {
        if (!selectedKey && panelEntries.length > 0) setSelectedKey(panelEntries[0].key);
    }, [panelEntries, selectedKey]);

    const selectedEntry = panelEntries.find((entry) => entry.key === selectedKey) || panelEntries[0];

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Workflow Interfaces</h1>
                    <p className="text-white-dark">Manage and view interfaces used across workflow stages</p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Registered Interfaces" value={registryEntries.length} icon={<IconRouter className="h-4 w-4" />} />
                <StatCard label="Stages Wired Up" value={wiredCount} icon={<IconCircleCheck className="h-4 w-4" />} iconClassName="bg-success-light text-success" />
                <StatCard
                    label="On Generic Fallback"
                    value={fallbackUsages.length}
                    helperText="No interface configured"
                    icon={<IconLayoutGrid className="h-4 w-4" />}
                    iconClassName="bg-secondary-light text-secondary"
                />
                <StatCard
                    label="Misconfigured"
                    value={orphanedUsages.length}
                    helperText="Key doesn't match any registered interface"
                    icon={<IconInfoTriangle className="h-4 w-4" />}
                    iconClassName={orphanedUsages.length > 0 ? 'bg-danger-light text-danger' : 'bg-secondary-light text-secondary'}
                />
            </div>

            {loading ? (
                <div className="panel mt-3 flex min-h-[200px] items-center justify-center gap-2">
                    <Spinner className="h-5 w-5 text-primary" />
                    <span className="text-white-dark">Scanning workflows for stage usage…</span>
                </div>
            ) : (
                <>
                    {orphanedUsages.length > 0 && (
                        <div className="panel mt-3 border-l-4 !border-l-danger">
                            <div className="flex items-center gap-2 font-semibold text-danger">
                                <IconInfoTriangle className="h-4.5 w-4.5" />
                                Misconfigured stages
                            </div>
                            <p className="mt-1 text-sm text-white-dark">
                                These stages reference an interface key that isn&apos;t registered — they&apos;ll silently render the generic action panel instead.
                            </p>
                            <ul className="mt-3 space-y-2">
                                {orphanedUsages.map((stage) => (
                                    <li key={stage.stageId} className="flex flex-wrap items-center gap-2 text-sm">
                                        <Link href={`/dashboard/admin/workflows/${stage.workflowId}/edit?tab=stages`} className="font-semibold text-primary hover:underline">
                                            {stage.workflowName} → {stage.stageName}
                                        </Link>
                                        <Badge variant="danger" outline>
                                            {stage.interfaceKey}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="panel mt-3 !p-0">
                        <div className="border-b border-white-light p-5 dark:border-white/10">
                            <h5 className="text-lg font-semibold">Workflow Interfaces</h5>
                            <p className="text-sm text-white-dark">View and manage interfaces used in workflow stages</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3">
                            <div className="border-b border-white-light p-4 dark:border-white/10 lg:border-b-0 lg:border-r">
                                <div className="font-semibold">Available Interfaces</div>
                                <p className="text-xs text-white-dark">Select an interface to view details</p>

                                <ul className="mt-3 max-h-[420px] space-y-1 overflow-y-auto">
                                    {panelEntries.map((entry) => (
                                        <li key={entry.key}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedKey(entry.key)}
                                                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                                    selectedEntry?.key === entry.key
                                                        ? 'bg-primary font-semibold text-white'
                                                        : 'text-dark hover:bg-primary-light hover:text-primary dark:text-white-light dark:hover:bg-primary/20'
                                                }`}
                                            >
                                                <span className="truncate">{entry.label}</span>
                                                {entry.usages.length > 0 && (
                                                    <Badge variant="warning" className={selectedEntry?.key === entry.key ? '!bg-white !text-primary' : ''}>
                                                        {entry.usages.length}
                                                    </Badge>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-5 lg:col-span-2">
                                {selectedEntry && (
                                    <>
                                        <h6 className="text-base font-semibold">Interface: {selectedEntry.label}</h6>
                                        <p className="mt-1 text-sm text-white-dark">{selectedEntry.description || 'No description available'}</p>

                                        <div className="mt-3 flex items-center gap-1.5 rounded-md bg-[#f6f8fa] px-2.5 py-1.5 text-xs text-white-dark dark:bg-[#1b2e4b]">
                                            <IconCode className="h-3.5 w-3.5 shrink-0" />
                                            <code className="truncate">{selectedEntry.path}</code>
                                        </div>

                                        <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold">
                                            <IconLink className="h-4 w-4 shrink-0" />
                                            Stages Using This Interface
                                        </div>
                                        {selectedEntry.usages.length === 0 ? (
                                            <p className="mt-3 rounded-md bg-[#f6f8fa] p-3 text-sm text-white-dark dark:bg-[#1b2e4b]">
                                                No stages are currently using the {selectedEntry.label} interface.
                                            </p>
                                        ) : (
                                            <ul className="mt-3 space-y-2">
                                                {selectedEntry.usages.map((usage) => (
                                                    <li key={usage.stageId}>
                                                        <Link
                                                            href={`/dashboard/admin/workflows/${usage.workflowId}/edit?tab=stages`}
                                                            className="flex items-center justify-between rounded-md border border-white-light px-3 py-2 text-sm hover:border-primary hover:text-primary dark:border-white/10"
                                                        >
                                                            <span>{usage.stageName}</span>
                                                            <span className="text-xs text-white-dark">{usage.workflowName}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default InterfaceRegistryPage;
