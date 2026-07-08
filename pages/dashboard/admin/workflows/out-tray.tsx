import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflowOutTray, WorkflowOutTrayItem } from '@/store/slices/workflows/workflowOutTraySlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import IconBox from '@/components/Icon/IconBox';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconXCircle from '@/components/Icon/IconXCircle';
import IconCalendar from '@/components/Icon/IconCalendar';
import IconClock from '@/components/Icon/IconClock';
import IconEye from '@/components/Icon/IconEye';

type TabKey = 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'REJECTED';

const statusBadgeVariant: Record<WorkflowOutTrayItem['status'], 'info' | 'warning' | 'success' | 'danger'> = {
    INITIATED: 'info',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    REJECTED: 'danger',
};

const enumLabel = (value: string) =>
    value
        .toLowerCase()
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');

const priorityBadgeVariant: Record<WorkflowOutTrayItem['priority'], 'info' | 'warning' | 'danger'> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
};

const relativeToNow = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
};

const WorkflowOutTrayPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { items, loading } = useAppSelector((state) => state.workflowOutTray);

    const [tab, setTab] = useState<TabKey>('ALL');

    useEffect(() => {
        dispatch(fetchWorkflowOutTray());
    }, [dispatch]);

    const counts = useMemo(
        () => ({
            ALL: items.length,
            COMPLETED: items.filter((item) => item.status === 'COMPLETED').length,
            IN_PROGRESS: items.filter((item) => item.status === 'IN_PROGRESS').length,
            REJECTED: items.filter((item) => item.status === 'REJECTED').length,
        }),
        [items]
    );

    const tabItems = useMemo(
        () => [
            { key: 'ALL', label: `All Actions (${counts.ALL})` },
            { key: 'COMPLETED', label: `Completed (${counts.COMPLETED})` },
            { key: 'IN_PROGRESS', label: `In Progress (${counts.IN_PROGRESS})` },
            { key: 'REJECTED', label: `Rejected (${counts.REJECTED})` },
        ],
        [counts]
    );

    const filteredItems = useMemo(() => (tab === 'ALL' ? items : items.filter((item) => item.status === tab)), [items, tab]);

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3">
                <h1 className="text-xl font-bold">Out-Tray</h1>
                <p className="text-white-dark">View workflow processes you have previously acted on</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total Actions" value={counts.ALL} helperText="Processes you have acted on" icon={<IconBox className="h-4 w-4" />} />
                <StatCard
                    label="Completed"
                    value={counts.COMPLETED}
                    helperText="Successfully completed processes"
                    icon={<IconCircleCheck className="h-4 w-4" />}
                    iconClassName="bg-success-light text-success"
                />
                <StatCard
                    label="Rejected"
                    value={counts.REJECTED}
                    helperText="Processes you have rejected"
                    icon={<IconXCircle className="h-4 w-4" />}
                    iconClassName="bg-danger-light text-danger"
                />
            </div>

            <div className="panel mt-3">
                <Tabs items={tabItems} active={tab} onChange={(key) => setTab(key as TabKey)} variant="boxed" />

                {loading ? (
                    <div className="flex min-h-[200px] items-center justify-center gap-2">
                        <Spinner className="h-5 w-5 text-primary" />
                        <span className="text-white-dark">Loading…</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <p className="py-10 text-center text-white-dark">No processes here yet.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {filteredItems.map((item) => (
                            <div key={item.instanceId} className="flex flex-col rounded-lg border border-white-light p-4 dark:border-white/10">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <div className="font-semibold">
                                            {item.processName} <span className="text-white-dark">#{item.processCode}</span>
                                        </div>
                                        <div className="text-xs text-white-dark">
                                            {item.workFlowName} · Ref: {item.processCode}
                                        </div>
                                    </div>
                                    <Badge variant={statusBadgeVariant[item.status]}>{enumLabel(item.status)}</Badge>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    <Badge variant="secondary" outline>
                                        {item.currentStageName} stage
                                    </Badge>
                                    <Badge variant={priorityBadgeVariant[item.priority]}>{enumLabel(item.priority)}</Badge>
                                </div>

                                <div className="mt-3 space-y-1 text-xs text-white-dark">
                                    {item.dueDate && (
                                        <div className="flex items-center gap-1.5">
                                            <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                                            Due: {new Date(item.dueDate).toLocaleDateString()}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <IconClock className="h-3.5 w-3.5 shrink-0" />
                                        Created {relativeToNow(item.initiatedAt)}
                                    </div>
                                </div>

                                <div className="mt-3 rounded-md bg-[#f6f8fa] p-2.5 text-xs dark:bg-[#1b2e4b]">
                                    <div className="font-semibold text-dark dark:text-white-light">Your last action</div>
                                    <div className="mt-0.5">{item.transitionName || 'Submitted'}</div>
                                    <div className="mt-1 text-white-dark">
                                        {item.fromStageName ? `${item.fromStageName} → ${item.toStageName}` : item.toStageName}
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2 pt-1">
                                    <Button size="sm" variant="outline-primary" className="flex-1" onClick={() => router.push(`/dashboard/admin/workflows/processes/${item.instanceId}`)}>
                                        <IconEye className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                                        Details
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => router.push(`/dashboard/admin/workflows/processes/${item.instanceId}?tab=timeline`)}
                                    >
                                        <IconClock className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                                        Timeline
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowOutTrayPage;
