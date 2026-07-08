import Dropdown from '@/components/Dropdown';
import IconHorizontalDots from '@/components/Icon/IconHorizontalDots';
import IconEye from '@/components/Icon/IconEye';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import IconUsersGroup from '@/components/Icon/IconUsersGroup';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconXCircle from '@/components/Icon/IconXCircle';
import IconLock from '@/components/Icon/IconLock';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconSend from '@/components/Icon/IconSend';

interface RowActionsMenuProps {
    onView?: () => void;
    onEdit?: () => void;
    onManageAccess?: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    onSuspend?: () => void;
    onReactivate?: () => void;
    onDelete?: () => void;
    /** Opens the stage's action panel (transitions/checklist/comment) — distinct from onView so pages needing both can offer them separately. */
    onReview?: () => void;
    /** Forward-to-person (reassign) — separate from onReview since it's a same-stage handoff, not a transition. */
    onForward?: () => void;
    label?: string;
}

// Single three-dot menu used in DataGrid "Actions" columns app-wide, replacing
// separate inline icon buttons with a View/Edit/Manage Access/Delete dropdown.
const RowActionsMenu = ({ onView, onEdit, onManageAccess, onApprove, onReject, onSuspend, onReactivate, onDelete, onReview, onForward, label = 'Row actions' }: RowActionsMenuProps) => {
    return (
        <div className="dropdown flex justify-center">
            <Dropdown
                placement="bottom-end"
                btnClassName="flex h-8 w-8 items-center justify-center rounded-full text-white-dark hover:bg-primary-light hover:text-primary"
                button={
                    <>
                        <span className="sr-only">{label}</span>
                        <IconHorizontalDots className="h-5 w-5" />
                    </>
                }
            >
                <ul className="w-[160px] !py-1 text-dark dark:text-white-dark">
                    {onView && (
                        <li>
                            <button type="button" onClick={onView}>
                                <IconEye className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                View
                            </button>
                        </li>
                    )}
                    {onReview && (
                        <li>
                            <button type="button" onClick={onReview}>
                                <IconEye className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                View Process
                            </button>
                        </li>
                    )}
                    {onForward && (
                        <li>
                            <button type="button" onClick={onForward}>
                                <IconSend className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Forward
                            </button>
                        </li>
                    )}
                    {onEdit && (
                        <li>
                            <button type="button" onClick={onEdit}>
                                <IconEdit className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Edit
                            </button>
                        </li>
                    )}
                    {onManageAccess && (
                        <li>
                            <button type="button" onClick={onManageAccess}>
                                <IconUsersGroup className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Manage Access
                            </button>
                        </li>
                    )}
                    {onApprove && (
                        <li>
                            <button type="button" className="text-success hover:!bg-success/10 hover:!text-success" onClick={onApprove}>
                                <IconCircleCheck className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Approve
                            </button>
                        </li>
                    )}
                    {onReject && (
                        <li>
                            <button type="button" className="text-danger hover:!bg-danger/10 hover:!text-danger" onClick={onReject}>
                                <IconXCircle className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Reject
                            </button>
                        </li>
                    )}
                    {onSuspend && (
                        <li>
                            <button type="button" className="text-warning hover:!bg-warning/10 hover:!text-warning" onClick={onSuspend}>
                                <IconLock className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Suspend
                            </button>
                        </li>
                    )}
                    {onReactivate && (
                        <li>
                            <button type="button" className="text-success hover:!bg-success/10 hover:!text-success" onClick={onReactivate}>
                                <IconRefresh className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Reactivate
                            </button>
                        </li>
                    )}
                    {onDelete && (
                        <li>
                            <button type="button" className="text-danger hover:!bg-danger/10 hover:!text-danger" onClick={onDelete}>
                                <IconTrash className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                Delete
                            </button>
                        </li>
                    )}
                </ul>
            </Dropdown>
        </div>
    );
};

export default RowActionsMenu;
