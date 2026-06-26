interface WaveDividerProps {
    flip?: boolean;
    className?: string;
}

// A hand-drawn-feeling wave, echoing the SmoothSurf logo mark, used to break the
// hard rectangular seams between sections instead of a straight line.
const WaveDivider = ({ flip = false, className = '' }: WaveDividerProps) => {
    return (
        <div aria-hidden="true" className={`pointer-events-none -mb-px w-full overflow-hidden ${flip ? 'rotate-180' : ''} ${className}`}>
            <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="h-8 w-full">
                <path d="M0 20 C 100 5, 200 35, 300 20 C 400 5, 500 35, 600 20 C 700 5, 800 35, 900 20 C 1000 5, 1100 35, 1200 20 L1200 40 L0 40 Z" fill="currentColor" />
            </svg>
        </div>
    );
};

export default WaveDivider;
