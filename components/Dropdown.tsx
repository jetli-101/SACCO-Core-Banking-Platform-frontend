import { createPortal } from 'react-dom';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { usePopper } from 'react-popper';

const Dropdown = (props: any, forwardedRef: any) => {
    const [visibility, setVisibility] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

    // usePopper only recomputes position when the element refs themselves change identity,
    // so they must come from useState (triggers a render) rather than a plain useRef (mutates
    // silently) — otherwise styles.popper stays {} forever and the menu renders in normal
    // document flow instead of floating next to the trigger button.
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
        placement: props.placement || 'bottom-end',
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: props.offset || [0, 4],
                },
            },
        ],
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!visibility) return;

        const handleMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (referenceElement?.contains(target) || popperElement?.contains(target)) return;
            setVisibility(false);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setVisibility(false);
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [visibility, referenceElement, popperElement]);

    useImperativeHandle(forwardedRef, () => ({
        close() {
            setVisibility(false);
        },
    }));

    return (
        <>
            <button ref={setReferenceElement} type="button" className={props.btnClassName} onClick={() => setVisibility((v) => !v)}>
                {props.button}
            </button>

            {mounted &&
                visibility &&
                createPortal(
                    <div ref={setPopperElement} style={styles.popper} {...attributes.popper} className="dropdown z-[999]" onClick={() => setVisibility(false)}>
                        {props.children}
                    </div>,
                    document.body
                )}
        </>
    );
};

export default forwardRef(Dropdown);
