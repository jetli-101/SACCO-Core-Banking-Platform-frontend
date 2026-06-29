import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '@/components/Icon/IconX';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: ReactNode;
}

// Written out as full class names (not built with template strings) so Tailwind's
// content scanner can detect and generate them.
const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

const Modal = ({ isOpen, onClose, title, footer, size = 'md', children }: ModalProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" open={isOpen} onClose={onClose} className="relative z-[51]">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-[black]/60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center px-4 py-8">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={`panel flex max-h-[85vh] w-full flex-col ${sizeClasses[size]} rounded-lg border-0 p-0`}>
                                {title && (
                                    <div className="flex shrink-0 items-center justify-between border-b border-white-light px-5 py-3 dark:border-white/10">
                                        <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
                                        <button type="button" className="text-white-dark hover:text-dark dark:hover:text-white-light" onClick={onClose}>
                                            <IconX className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}
                                <div className="overflow-y-auto p-5">{children}</div>
                                {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white-light px-5 py-3 dark:border-white/10">{footer}</div>}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default Modal;
