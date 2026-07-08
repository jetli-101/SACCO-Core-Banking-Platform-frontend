import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserGroups, createUserGroup, deleteUserGroup, clearUserGroupsError, UserGroup, UserGroupPayload } from '@/store/slices/userGroups/userGroupsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Breadcrumb from '@/components/ui/Breadcrumb';
import IconPlus from '@/components/Icon/IconPlus';
import IconUsersGroup from '@/components/Icon/IconUsersGroup';
import IconUsers from '@/components/Icon/IconUsers';
import IconUserPlus from '@/components/Icon/IconUserPlus';

const emptyForm: UserGroupPayload = { name: '', description: '' };

const UserGroupsPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { groups, groupsLoading, groupsError, saving, error } = useAppSelector((state) => state.userGroups);

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<UserGroupPayload>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<UserGroup | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchUserGroups());
    }, [dispatch]);

    const openCreate = () => {
        setForm(emptyForm);
        dispatch(clearUserGroupsError());
        setModalOpen(true);
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const group = await dispatch(createUserGroup(form)).unwrap();
            dispatch(showToast({ variant: 'success', message: `User group "${form.name}" created successfully` }));
            setModalOpen(false);
            router.push(`/dashboard/admin/user-groups/${group.id}?tab=permissions`);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save user group' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteUserGroup(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `User group "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete user group' }));
        } finally {
            setDeleting(false);
        }
    };

    const totalAssignments = groups.reduce((sum, group) => sum + group.memberCount, 0);
    const avgMembersPerGroup = groups.length ? Math.round(totalAssignments / groups.length) : 0;

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">User Groups</h1>
                    <p className="text-white-dark">Manage workflow/approval groupings and which modules each group can access</p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total Groups" value={groups.length} icon={<IconUsersGroup className="h-4 w-4" />} />
                <StatCard label="Total Assignments" value={totalAssignments} icon={<IconUsers className="h-4 w-4" />} />
                <StatCard label="Avg Members/Group" value={avgMembersPerGroup} icon={<IconUserPlus className="h-4 w-4" />} />
            </div>

            {(error || groupsError) && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearUserGroupsError())}>
                        {error || groupsError}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-3"
                title="User Groups"
                count={groups.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: UserGroup) => (
                            <RowActionsMenu onView={() => router.push(`/dashboard/admin/user-groups/${row.id}`)} onDelete={() => setDeleteTarget(row)} label={`Actions for ${row.name}`} />
                        ),
                    },
                    { header: 'Group', accessor: 'name' },
                    { header: 'Description', accessor: (row: UserGroup) => row.description || '—' },
                    { header: 'No. of Members', accessor: 'memberCount' },
                ]}
                data={groups}
                rowKey={(row) => row.id}
                searchKeys={['name', 'description']}
                searchPlaceholder="Search groups..."
                loading={groupsLoading}
                emptyMessage="No user groups yet"
                onRefresh={() => dispatch(fetchUserGroups())}
                toolbarActions={
                    <Button size="sm" onClick={openCreate}>
                        <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                        New Group
                    </Button>
                }
            />

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Group">
                <form onSubmit={submitForm} className="space-y-4">
                    <Input id="name" label="Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Finance Approvers" required />
                    <Input id="description" label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Creating…' : 'Create & Continue to Permissions'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete User Group"
                message={`Delete user group "${deleteTarget?.name}"? This fails if the group still has any members.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default UserGroupsPage;
