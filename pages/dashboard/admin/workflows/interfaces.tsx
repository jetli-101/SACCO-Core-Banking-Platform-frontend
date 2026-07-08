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

// A rotating avatar palette so the registry reads as a colorful "plugin board"
// rather than a plain list — each registered interface gets a stable color by
// index, independent of how many are registered.
const AVATAR_PALETTE = [
    'bg-primary-light text-primary',
    'bg-success-light text-success',
    'bg-info-light text-info',
    'bg-warning-light text-warning',
    'bg-danger-light text-danger',
    'bg-secondary-light text-secondary',
];

const InterfaceRegistryPage = () => {
    const [stages, setStages] = useState<StageUsage[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Interface Registry</h1>
                    <p className="text-white-dark">Every action-panel screen registered for a workflow stage, and which stages currently use it</p>
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

                    <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {registryEntries.map((entry, index) => {
                            const usages = usageByKey[entry.value] || [];
                            const avatarClass = AVATAR_PALETTE[index % AVATAR_PALETTE.length];

                            return (
                                <div key={entry.value} className="flex flex-col rounded-lg border border-white-light p-4 dark:border-white/10">
                                    <div className="flex items-start gap-3">
                                        <span className={`grid h-11 w-11 shrink-0 place-content-center rounded-full text-lg font-bold ${avatarClass}`}>
                                            {entry.label.charAt(0)}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="font-semibold">{entry.label}</div>
                                            <Badge variant="secondary" outline className="mt-1 font-mono text-[11px]">
                                                {entry.value}
                                            </Badge>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-sm text-white-dark">{entry.description}</p>

                                    <div className="mt-3 flex items-center gap-1.5 rounded-md bg-[#f6f8fa] px-2.5 py-1.5 text-xs text-white-dark dark:bg-[#1b2e4b]">
                                        <IconCode className="h-3.5 w-3.5 shrink-0" />
                                        <code className="truncate">{entry.path}</code>
                                    </div>

                                    <div className="mt-4 flex-1">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-white-dark">
                                            <IconLink className="h-3.5 w-3.5" />
                                            Used by {usages.length} stage{usages.length === 1 ? '' : 's'}
                                        </div>
                                        {usages.length === 0 ? (
                                            <p className="mt-2 text-xs text-white-dark">Not wired to any stage yet — pick it from a stage&apos;s Interface dropdown.</p>
                                        ) : (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {usages.map((usage) => (
                                                    <Link
                                                        key={usage.stageId}
                                                        href={`/dashboard/admin/workflows/${usage.workflowId}/edit?tab=stages`}
                                                        className="rounded-full border border-white-light px-2.5 py-1 text-xs hover:border-primary hover:text-primary dark:border-white/10"
                                                    >
                                                        {usage.workflowName} · {usage.stageName}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex flex-col rounded-lg border border-dashed border-white-light p-4 dark:border-white/10">
                            <div className="flex items-start gap-3">
                                <span className="grid h-11 w-11 shrink-0 place-content-center rounded-full bg-[#ebedf2] text-white-dark dark:bg-[#1b2e4b]">
                                    <IconLayoutGrid className="h-5 w-5" />
                                </span>
                                <div>
                                    <div className="font-semibold">Generic Action Panel</div>
                                    <Badge variant="dark" outline className="mt-1 text-[11px]">
                                        built-in fallback
                                    </Badge>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-white-dark">
                                Always available. Renders raw stage data with transition buttons, checklist, comment box, and forward-to-person — used automatically whenever a
                                stage has no interface configured.
                            </p>
                            <div className="mt-4 flex-1">
                                <div className="text-xs font-semibold uppercase text-white-dark">
                                    Used by {fallbackUsages.length} stage{fallbackUsages.length === 1 ? '' : 's'}
                                </div>
                                {fallbackUsages.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {fallbackUsages.map((usage) => (
                                            <Link
                                                key={usage.stageId}
                                                href={`/dashboard/admin/workflows/${usage.workflowId}/edit?tab=stages`}
                                                className="rounded-full border border-white-light px-2.5 py-1 text-xs hover:border-primary hover:text-primary dark:border-white/10"
                                            >
                                                {usage.workflowName} · {usage.stageName}
                                            </Link>
                                        ))}
                                    </div>
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
