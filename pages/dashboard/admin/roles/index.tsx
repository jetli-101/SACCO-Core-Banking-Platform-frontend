import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRoles, createRole, updateRole, deleteRole, clearRolesError, Role, RolePayload } from '@/store/slices/roles/rolesSlice';
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
import RoleModulesModal from '@/components/roles/RoleModulesModal';
import IconPlus from '@/components/Icon/IconPlus';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconUsersGroup from '@/components/Icon/IconUsersGroup';

const emptyForm: RolePayload = { name: '', description: '' };

const RolesPage = () => {
    const dispatch = useAppDispatch();
    const { roles, rolesLoading, rolesError, saving, error } = useAppSelector((state) => state.roles);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [form, setForm] = useState<RolePayload>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [modulesTarget, setModulesTarget] = useState<Role | null>(null);

    useEffect(() => {
        dispatch(fetchRoles());
    }, [dispatch]);

    const openCreate = () => {
        setEditing(null);
        setViewOnly(false);
        setForm(emptyForm);
        dispatch(clearRolesError());
        setModalOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditing(role);
        setViewOnly(false);
        setForm({ name: role.name, description: role.description || '' });
        dispatch(clearRolesError());
        setModalOpen(true);
    };

    const openView = (role: Role) => {
        setEditing(role);
        setViewOnly(true);
        setForm({ name: role.name, description: role.description || '' });
        dispatch(clearRolesError());
        setModalOpen(true);
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editing) {
                await dispatch(updateRole({ id: editing.id, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Role "${form.name}" updated successfully` }));
            } else {
                await dispatch(createRole(form)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Role "${form.name}" created successfully` }));
            }
            setModalOpen(false);
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

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Roles' }]} />

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Roles</h1>
                    <p className="text-white-dark">Manage the role groups that control which modules show up in a member&apos;s sidebar</p>
                </div>
                <Button onClick={openCreate}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Role
                </Button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-sm">
                <StatCard label="Total Roles" value={roles.length} icon={<IconUsersGroup className="h-4 w-4" />} />
            </div>

            {(error || rolesError) && (
                <div className="mt-5">
                    <Alert variant="danger" onClose={() => dispatch(clearRolesError())}>
                        {error || rolesError}
                    </Alert>
                </div>
            )}

            <div className="panel mt-5">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold">Role Records</h5>
                    <p className="text-sm text-white-dark">View and manage all role groups, and which modules each one can access</p>
                </div>

                <DataGrid
                    columns={[
                        {
                            header: 'Actions',
                            accessor: (row: Role) => (
                                <RowActionsMenu
                                    onView={() => openView(row)}
                                    onEdit={() => openEdit(row)}
                                    onManageAccess={() => setModulesTarget(row)}
                                    onDelete={() => setDeleteTarget(row)}
                                    label={`Actions for ${row.name}`}
                                />
                            ),
                        },
                        { header: 'Name', accessor: 'name' },
                        { header: 'Description', accessor: (row: Role) => row.description || '—' },
                    ]}
                    data={roles}
                    rowKey={(row) => row.id}
                    searchKeys={['name', 'description']}
                    searchPlaceholder="Search roles..."
                    loading={rolesLoading}
                    emptyMessage="No roles yet"
                    toolbarActions={
                        <Button variant="outline-primary" size="sm" onClick={() => dispatch(fetchRoles())}>
                            <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Refresh
                        </Button>
                    }
                />
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={viewOnly ? 'View Role' : editing ? 'Edit Role' : 'New Role'}>
                <form onSubmit={submitForm} className="space-y-4">
                    <Input id="name" label="Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. ROLE_BRANCH_MANAGER" required disabled={viewOnly} />
                    <Input
                        id="description"
                        label="Description"
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        disabled={viewOnly}
                    />

                    <div className="flex items-center justify-end gap-2 pt-2">
                        {viewOnly ? (
                            <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                                </Button>
                            </>
                        )}
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

            <RoleModulesModal isOpen={!!modulesTarget} roleId={modulesTarget?.id ?? null} roleName={modulesTarget?.name} onClose={() => setModulesTarget(null)} />
        </div>
    );
};

export default RolesPage;
