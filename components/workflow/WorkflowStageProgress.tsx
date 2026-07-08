import { ReactNode, useState } from 'react';
import type { WorkflowStage } from '@/store/slices/workflows/workflowStagesSlice';
import Spinner from '@/components/ui/Spinner';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconClock from '@/components/Icon/IconClock';
import IconCaretDown from '@/components/Icon/IconCaretDown';

interface WorkflowStageProgressProps {
    workFlowName: string;
    currentStageId: string;
    currentStageName: string;
    stages: WorkflowStage[];
    /** Extra content revealed by the "Show Details" toggle — e.g. the instance's raw data payload. */
    detailsContent?: ReactNode;
}

// The horizontal stage tracker shown at the top of the Stage Details modal and the Task
// Details page — a green pill for the workflow, the current stage's name, and a row of
// stage icons (done/current/pending) joined by a fill-proportional progress bar.
const WorkflowStageProgress = ({ workFlowName, currentStageId, currentStageName, stages, detailsContent }: WorkflowStageProgressProps) => {
    const [expanded, setExpanded] = useState(false);

    const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);
    const progressPct = stages.length > 1 && currentIndex >= 0 ? (currentIndex / (stages.length - 1)) * 100 : currentIndex === 0 ? 0 : 100;

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="badge bg-primary text-white shadow-md">{workFlowName}</span>
                <span className="text-white-dark">
                    Stage: <span className="font-semibold text-dark dark:text-white-light">{currentStageName}</span>
                </span>
                {detailsContent && (
                    <button type="button" className="flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => setExpanded((prev) => !prev)}>
                        {expanded ? 'Hide Details' : 'Show Details'}
                        <IconCaretDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {expanded && detailsContent && <div className="mt-2">{detailsContent}</div>}

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#ebedf2] dark:bg-white/10">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="mt-2 flex items-start justify-between gap-1">
                {stages.map((stage) => {
                    const status = stage.orderNo < stages[currentIndex]?.orderNo ? 'done' : stage.id === currentStageId ? 'current' : 'pending';
                    return (
                        <div key={stage.id} className="flex flex-1 flex-col items-center gap-1 text-center">
                            <span
                                className={`grid h-7 w-7 shrink-0 place-content-center rounded-full ${
                                    status === 'done'
                                        ? 'bg-success text-white'
                                        : status === 'current'
                                          ? 'bg-primary-light text-primary'
                                          : 'bg-[#ebedf2] text-white-dark dark:bg-white/10'
                                }`}
                            >
                                {status === 'done' ? <IconCircleCheck className="h-4 w-4" /> : status === 'current' ? <Spinner className="h-4 w-4" /> : <IconClock className="h-4 w-4" />}
                            </span>
                            <span className={`max-w-[90px] truncate text-xs ${status === 'current' ? 'font-semibold text-primary' : 'text-white-dark'}`}>{stage.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WorkflowStageProgress;
