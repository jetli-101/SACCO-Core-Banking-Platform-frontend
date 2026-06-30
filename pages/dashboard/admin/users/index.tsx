import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, clearUsersError, updateUserStatus, approveMember, rejectMember, AppUser } from '@/store/slices/users/usersSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import Breadcrumb from '@/components/ui/Breadcrumb';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Spinner from '@/components/ui/Spinner';
import IconUsers from '@/components/Icon/IconUsers';
import IconClock from '@/components/Icon/IconClock';

const statusBadgeClass: Record<string, string> = {
    ACTIVE: 'bg-success-light text-success',
    PENDING: 'bg-warning-light text-warning',
    SUSPENDED: 'bg-danger-light text-danger',
    LOCKED: 'bg-danger-light text-danger',
    DEACTIVATED: 'bg-white-light text-white-dark dark:bg-dark/40',
    INACTIVE: 'bg-white-light text-white-dark dark:bg-dark/40',
    REJECTED: 'bg-danger-light text-danger',
};

type ReasonActionType = 'reject' | 'suspend';

const UsersPage = () => {
    const dispatch = useAppDispatch();
    const { users, loading, actioningId, error } = useAppSelector((state) => state.users);

    const [approveTarget, setApproveTarget] = useState<AppUser | null>(null);
    const [reactivateTarget, setReactivateTarget] = useState<AppUser | null>(null);
    const [reasonAction, setReasonAction] = useState<{ type: ReasonActionType; user: AppUser } | null>(null);
    const [reason, setReason] = useState('');

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const pendingCount = users.filter((user) => user.status === 'PENDING').length;

    const closeReasonModal = () => {
        setReasonAction(null);
        setReason('');
    };

    const confirmApprove = async () => {
        if (!approveTarget?.memberId) return;
        try {
            await dispatch(approveMember({ memberId: approveTarget.memberId })).unwrap();
            dispatch(showToast({ variant: 'success', message: `${approveTarget.username} approved successfully` }));
            setApproveTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to approve member' }));
        }
    };

    const confirmReactivate = async () => {
        if (!reactivateTarget) return;
        try {
            await dispatch(updateUserStatus({ id: reactivateTarget.id, status: 'ACTIVE' })).unwrap();
            dispatch(showToast({ variant: 'success', message: `${reactivateTarget.username} reactivated successfully` }));
            setReactivateTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to reactivate account' }));
        }
    };

    const confirmReasonAction = async () => {
        if (!reasonAction) return;
        try {
            if (reasonAction.type === 'reject') {
                if (!reasonAction.user.memberId) return;
                await dispatch(rejectMember({ memberId: reasonAction.user.memberId, comments: reason || undefined })).unwrap();
                dispatch(showToast({ variant: 'success', message: `${reasonAction.user.username} rejected` }));
            } else {
                await dispatch(updateUserStatus({ id: reasonAction.user.id, status: 'SUSPENDED', reason: reason || undefined })).unwrap();
                dispatch(showToast({ variant: 'success', message: `${reasonAction.user.username} suspended` }));
            }
            closeReasonModal();
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to complete this action' }));
        }
    };

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Users</h1>
                    <p className="text-white-dark">Every staff and member account in your Sacco</p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-md">
                <StatCard label="Total Users" value={users.length} icon={<IconUsers className="h-4 w-4" />} />
                <StatCard label="Pending Approval" value={pendingCount} icon={<IconClock className="h-4 w-4" />} />
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearUsersError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-3"
                title="User Accounts"
                count={users.length}
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: AppUser) => (
                            <RowActionsMenu
                                label={`Actions for ${row.username}`}
                                onApprove={row.status === 'PENDING' && row.memberId ? () => setApproveTarget(row) : undefined}
                                onReject={row.status === 'PENDING' && row.memberId ? () => setReasonAction({ type: 'reject', user: row }) : undefined}
                                onSuspend={row.status === 'ACTIVE' ? () => setReasonAction({ type: 'suspend', user: row }) : undefined}
                                onReactivate={['SUSPENDED', 'LOCKED', 'DEACTIVATED'].includes(row.status || '') ? () => setReactivateTarget(row) : undefined}
                            />
                        ),
                    },
                    { header: 'Username', accessor: 'username' },
                    { header: 'Email', accessor: 'email' },
                    { header: 'Phone', accessor: (row: AppUser) => row.phone || '—' },
                    { header: 'Roles', accessor: (row: AppUser) => (row.roles?.length ? row.roles.join(', ') : '—') },
                    {
                        header: 'Status',
                        accessor: (row: AppUser) => (
                            <span className={`badge ${statusBadgeClass[row.status || ''] || 'bg-white-light text-white-dark dark:bg-dark/40'}`}>{row.status || '—'}</span>
                        ),
                    },
                ]}
                data={users}
                rowKey={(row) => row.id}
                searchKeys={['username', 'email', 'phone']}
                searchPlaceholder="Search users..."
                loading={loading}
                emptyMessage="No users yet"
                onRefresh={() => dispatch(fetchUsers())}
            />

            <ConfirmModal
                isOpen={!!approveTarget}
                title="Approve User"
                message={`Approve "${approveTarget?.username}"? This activates their account and assigns a member number.`}
                confirmLabel="Approve"
                loading={!!approveTarget && actioningId === approveTarget.memberId}
                onConfirm={confirmApprove}
                onCancel={() => setApproveTarget(null)}
            />

            <ConfirmModal
                isOpen={!!reactivateTarget}
                title="Reactivate User"
                message={`Reactivate "${reactivateTarget?.username}"? They will be able to log in again.`}
                confirmLabel="Reactivate"
                loading={!!reactivateTarget && actioningId === reactivateTarget.id}
                onConfirm={confirmReactivate}
                onCancel={() => setReactivateTarget(null)}
            />

            <Modal isOpen={!!reasonAction} onClose={closeReasonModal} title={reasonAction?.type === 'reject' ? 'Reject User' : 'Suspend User'} size="sm">
                <p className="text-sm text-white-dark">
                    {reasonAction?.type === 'reject'
                        ? `Reject "${reasonAction?.user.username}"? This marks the registration as rejected.`
                        : `Suspend "${reasonAction?.user.username}"? They won't be able to log in until reactivated.`}
                </p>
                <div className="mt-3">
                    <label htmlFor="reason" className="mb-1.5 block text-sm font-semibold">
                        Reason (optional)
                    </label>
                    <textarea id="reason" className="form-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="mt-5 flex items-center justify-end gap-2">
                    <Button type="button" variant="outline-dark" onClick={closeReasonModal}>
                        Cancel
                    </Button>
                    <Button type="button" variant="danger" onClick={confirmReasonAction} disabled={!!reasonAction && actioningId === (reasonAction.type === 'reject' ? reasonAction.user.memberId : reasonAction.user.id)}>
                        {!!reasonAction && actioningId === (reasonAction.type === 'reject' ? reasonAction.user.memberId : reasonAction.user.id) && (
                            <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        )}
                        {reasonAction?.type === 'reject' ? 'Reject' : 'Suspend'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default UsersPage;
