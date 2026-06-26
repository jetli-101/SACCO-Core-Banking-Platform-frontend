import { ReactElement } from 'react';
import Tippy, { TippyProps } from '@tippyjs/react';

interface TooltipProps {
    content: TippyProps['content'];
    placement?: TippyProps['placement'];
    children: ReactElement;
}

const Tooltip = ({ content, placement = 'top', children }: TooltipProps) => {
    return (
        <Tippy content={content} placement={placement}>
            {children}
        </Tippy>
    );
};

export default Tooltip;
