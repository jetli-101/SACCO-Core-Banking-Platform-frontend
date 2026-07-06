import { useMemo } from 'react';
import { WorkflowStage } from '@/store/slices/workflows/workflowStagesSlice';
import { TransitionActionType, WorkflowTransition } from '@/store/slices/workflows/workflowTransitionsSlice';
import Badge from '@/components/ui/Badge';

interface WorkflowVisualizationProps {
    stages: WorkflowStage[];
    transitions: WorkflowTransition[];
}

const NODE_WIDTH = 176;
const NODE_HEIGHT = 68;
const GAP = 110;
const STEP = NODE_WIDTH + GAP;
const PADDING = 40;
const CENTER_Y = 170;
const CANVAS_HEIGHT = 340;

const ACTION_COLORS: Record<TransitionActionType, string> = {
    NORMAL_SUBMISSION: '#2196f3',
    APPROVAL: '#00ab55',
    REJECTION: '#e7515a',
    RETURN: '#e2a03f',
};

const ACTION_LABELS: Record<TransitionActionType, string> = {
    NORMAL_SUBMISSION: 'Normal Submission',
    APPROVAL: 'Approval',
    REJECTION: 'Rejection',
    RETURN: 'Return',
};

// Hand-rolled box-and-arrow rendering — no diagram library in this project. Stages sit on
// a single centerline in orderNo sequence; transitions curve above the line when moving
// forward across a gap, below it when moving backward (e.g. a "Return" transition), and
// loop above the node for a self-transition. Multiple transitions between the same pair
// fan out by nudging each additional arc further from the centerline.
const WorkflowVisualization = ({ stages, transitions }: WorkflowVisualizationProps) => {
    const indexById = useMemo(() => new Map(stages.map((stage, index) => [stage.id, index])), [stages]);

    const canvasWidth = Math.max(stages.length * STEP - GAP + PADDING * 2, 640);

    const edges = useMemo(() => {
        const occurrenceByPair = new Map<string, number>();

        return transitions
            .map((transition) => {
                const fromIdx = indexById.get(transition.fromStageId);
                const toIdx = indexById.get(transition.toStageId);
                if (fromIdx === undefined || toIdx === undefined) return null;

                const pairKey = `${fromIdx}-${toIdx}`;
                const occurrence = occurrenceByPair.get(pairKey) || 0;
                occurrenceByPair.set(pairKey, occurrence + 1);

                const fromX = PADDING + fromIdx * STEP;
                const toX = PADDING + toIdx * STEP;
                const fromCenterX = fromX + NODE_WIDTH / 2;
                const toCenterX = toX + NODE_WIDTH / 2;
                const color = ACTION_COLORS[transition.actionType];

                let d: string;
                let labelX: number;
                let labelY: number;

                if (toIdx === fromIdx + 1) {
                    // Immediate forward step — a straight line along the centerline.
                    const y = CENTER_Y - occurrence * 16;
                    d = `M ${fromX + NODE_WIDTH},${y} L ${toX},${y}`;
                    labelX = (fromX + NODE_WIDTH + toX) / 2;
                    labelY = y - 8;
                } else if (toIdx === fromIdx) {
                    // Self-transition — a small loop above the node.
                    const topY = CENTER_Y - NODE_HEIGHT / 2;
                    const controlY = topY - (70 + occurrence * 34);
                    d = `M ${fromCenterX - 24},${topY} C ${fromCenterX - 70},${controlY} ${fromCenterX + 70},${controlY} ${fromCenterX + 24},${topY}`;
                    labelX = fromCenterX;
                    labelY = controlY - 6;
                } else if (toIdx > fromIdx) {
                    // Forward, skipping one or more stages — arc above the centerline.
                    const topY = CENTER_Y - NODE_HEIGHT / 2;
                    const controlY = topY - (60 + occurrence * 34);
                    d = `M ${fromCenterX},${topY} Q ${(fromCenterX + toCenterX) / 2},${controlY} ${toCenterX},${topY}`;
                    labelX = (fromCenterX + toCenterX) / 2;
                    labelY = controlY - 6;
                } else {
                    // Backward — e.g. a "Return to previous stage" transition — arc below.
                    const bottomY = CENTER_Y + NODE_HEIGHT / 2;
                    const controlY = bottomY + (60 + occurrence * 34);
                    d = `M ${fromCenterX},${bottomY} Q ${(fromCenterX + toCenterX) / 2},${controlY} ${toCenterX},${bottomY}`;
                    labelX = (fromCenterX + toCenterX) / 2;
                    labelY = controlY + 14;
                }

                return { id: transition.id, d, color, labelX, labelY, name: transition.name, actionType: transition.actionType };
            })
            .filter((edge): edge is NonNullable<typeof edge> => edge !== null);
    }, [transitions, indexById]);

    if (stages.length === 0) {
        return <p className="py-10 text-center text-white-dark">Add stages first to see the workflow diagram.</p>;
    }

    return (
        <div>
            <div className="overflow-x-auto rounded-lg border border-white-light dark:border-white/10">
                <div className="relative" style={{ width: canvasWidth, height: CANVAS_HEIGHT }}>
                    <svg width={canvasWidth} height={CANVAS_HEIGHT} className="absolute inset-0">
                        <defs>
                            {(Object.keys(ACTION_COLORS) as TransitionActionType[]).map((actionType) => (
                                <marker key={actionType} id={`arrow-${actionType}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                                    <path d="M0,0 L8,4 L0,8 Z" fill={ACTION_COLORS[actionType]} />
                                </marker>
                            ))}
                        </defs>
                        {edges.map((edge) => (
                            <path key={edge.id} d={edge.d} fill="none" stroke={edge.color} strokeWidth={2} markerEnd={`url(#arrow-${edge.actionType})`} />
                        ))}
                        {edges.map((edge) => (
                            <text key={`${edge.id}-label`} x={edge.labelX} y={edge.labelY} textAnchor="middle" fontSize={11} fill={edge.color} className="font-semibold">
                                {edge.name}
                            </text>
                        ))}
                    </svg>

                    {stages.map((stage, index) => (
                        <div
                            key={stage.id}
                            className="absolute flex flex-col items-center justify-center gap-1 rounded-lg border border-white-light bg-white p-2 text-center shadow-sm dark:border-white/10 dark:bg-[#0e1726]"
                            style={{ left: PADDING + index * STEP, top: CENTER_Y - NODE_HEIGHT / 2, width: NODE_WIDTH, height: NODE_HEIGHT }}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="grid h-5 w-5 shrink-0 place-content-center rounded-full bg-success text-[10px] font-semibold text-white">{stage.orderNo}</span>
                                <span className="truncate text-xs font-semibold">{stage.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {stage.isInitial && (
                                    <Badge variant="info" className="!px-1.5 !py-0 text-[10px]">
                                        Initial
                                    </Badge>
                                )}
                                {stage.isFinal && (
                                    <Badge variant="warning" className="!px-1.5 !py-0 text-[10px]">
                                        Final
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
                {(Object.keys(ACTION_COLORS) as TransitionActionType[]).map((actionType) => (
                    <span key={actionType} className="flex items-center gap-1.5 text-xs text-white-dark">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACTION_COLORS[actionType] }} />
                        {ACTION_LABELS[actionType]}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default WorkflowVisualization;
