import Dropdown from '@/components/Dropdown';
import IconHorizontalDots from '@/components/Icon/IconHorizontalDots';
import IconEye from '@/components/Icon/IconEye';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import IconUsersGroup from '@/components/Icon/IconUsersGroup';

interface RowActionsMenuProps {
    onView?: () => void;
    onEdit?: () => void;
    onManageAccess?: () => void;
    onDelete?: () => void;
    label?: string;
}

// Single three-dot menu used in DataGrid "Actions" columns app-wide, replacing
// separate inline icon buttons with a View/Edit/Manage Access/Delete dropdown.
const RowActionsMenu = ({ onView, onEdit, onManageAccess, onDelete, label = 'Row actions' }: RowActionsMenuProps) => {
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
                <ul className="w-[140px] !py-1 text-dark dark:text-white-dark">
                    {onView && (
                        <li>
                            <button type="button" onClick={onView}>
                                <IconEye className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                View
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
