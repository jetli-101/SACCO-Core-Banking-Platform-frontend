import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRoles, createRole, deleteRole, clearRolesError, Role, RolePayload } from '@/store/slices/roles/rolesSlice';
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
import IconPrinter from '@/components/Icon/IconPrinter';
import IconUsersGroup from '@/components/Icon/IconUsersGroup';
import IconUsers from '@/components/Icon/IconUsers';
import IconUserPlus from '@/components/Icon/IconUserPlus';

const emptyForm: RolePayload = { name: '', description: '' };

const RolesPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { roles, rolesLoading, rolesError, saving, error } = useAppSelector((state) => state.roles);

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<RolePayload>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchRoles());
    }, [dispatch]);

    const openCreate = () => {
        setForm(emptyForm);
        dispatch(clearRolesError());
        setModalOpen(true);
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const role = await dispatch(createRole(form)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Role "${form.name}" created successfully` }));
            setModalOpen(false);
            router.push(`/dashboard/admin/roles/${role.id}?tab=permissions`);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save role' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteRole(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Role "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete role' }));
        } finally {
            setDeleting(false);
        }
    };

    const totalAssignments = roles.reduce((sum, role) => sum + role.memberCount, 0);
    const avgMembersPerRole = roles.length ? Math.round(totalAssignments / roles.length) : 0;

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Configuration' }, { label: 'Roles' }]} />

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Roles</h1>
                    <p className="text-white-dark">Manage system roles configuration across your application</p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Total Roles" value={roles.length} icon={<IconUsersGroup className="h-4 w-4" />} />
                <StatCard label="Total Assignments" value={totalAssignments} icon={<IconUsers className="h-4 w-4" />} />
                <StatCard label="Avg Members/Role" value={avgMembersPerRole} icon={<IconUserPlus className="h-4 w-4" />} />
            </div>

            {(error || rolesError) && (
                <div className="mt-5">
                    <Alert variant="danger" onClose={() => dispatch(clearRolesError())}>
                        {error || rolesError}
                    </Alert>
                </div>
            )}

            <div className="panel mt-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h5 className="text-lg font-semibold">
                        System Roles <span className="text-white-dark">{roles.length}</span>
                    </h5>
                    <div className="flex items-center gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => window.print()}>
                            <IconPrinter className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Print
                        </Button>
                        <Button onClick={openCreate}>
                            <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Add New Role
                        </Button>
                    </div>
                </div>

                <DataGrid
                    columns={[
                        {
                            header: 'Actions',
                            accessor: (row: Role) => (
                                <RowActionsMenu
                                    onView={() => router.push(`/dashboard/admin/roles/${row.id}`)}
                                    onDelete={() => setDeleteTarget(row)}
                                    label={`Actions for ${row.name}`}
                                />
                            ),
                        },
                        { header: 'Role Name', accessor: 'name' },
                        { header: 'Description', accessor: (row: Role) => row.description || '—' },
                        {
                            header: 'Status',
                            accessor: () => (
                                <span className="badge flex w-fit items-center gap-1 bg-success-light text-success">
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                                </span>
                            ),
                        },
                    ]}
                    data={roles}
                    rowKey={(row) => row.id}
                    searchKeys={['name', 'description']}
                    searchPlaceholder="Search roles..."
                    loading={rolesLoading}
                    emptyMessage="No roles yet"
                />
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Role">
                <form onSubmit={submitForm} className="space-y-4">
                    <Input id="name" label="Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. ROLE_BRANCH_MANAGER" required />
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
                title="Delete Role"
                message={`Delete role "${deleteTarget?.name}"? This fails if the role is still assigned to any user.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default RolesPage;
