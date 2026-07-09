import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRoleById, updateRole, fetchRoleModules, grantModulesToRole, revokeModulesFromRole, fetchRoleMembers, addRoleMember, removeRoleMember, RolePayload } from '@/store/slices/roles/rolesSlice';
import { fetchModules, fetchModuleTypes } from '@/store/slices/modules/modulesSlice';
import { fetchUsers } from '@/store/slices/users/usersSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Tabs from '@/components/ui/Tabs';
import PageLoader from '@/components/ui/PageLoader';
import ModulePermissionsAccordion from '@/components/permissions/ModulePermissionsAccordion';
import GroupMembersPanel from '@/components/permissions/GroupMembersPanel';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';

type TabKey = 'details' | 'permissions' | 'members';

const RoleDetailPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const id = typeof router.query.id === 'string' ? router.query.id : '';
    const initialTab = typeof router.query.tab === 'string' ? (router.query.tab as TabKey) : 'details';

    const { roles, members, membersLoading, saving, error } = useAppSelector((state) => state.roles);
    const { users } = useAppSelector((state) => state.users);
    const role = roles.find((item) => item.id === id);

    const [tab, setTab] = useState<TabKey>(initialTab);
    const [form, setForm] = useState<RolePayload>({ name: '', description: '' });
    const [grantedIds, setGrantedIds] = useState<Set<string>>(new Set());
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        setRoleLoading(true);
        dispatch(fetchRoleById(id))
            .unwrap()
            .catch(() => undefined)
            .finally(() => setRoleLoading(false));
        dispatch(fetchModules());
        dispatch(fetchModuleTypes());
        dispatch(fetchUsers());
        dispatch(fetchRoleMembers(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (role) setForm({ name: role.name, description: role.description || '' });
    }, [role]);

    useEffect(() => {
        if (!id) return;
        setPermissionsLoading(true);
        dispatch(fetchRoleModules(id))
            .unwrap()
            .then((modules) => setGrantedIds(new Set(modules.map((module) => module.id))))
            .catch(() => undefined)
            .finally(() => setPermissionsLoading(false));
    }, [dispatch, id]);

    const saveDetails = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await dispatch(updateRole({ id, payload: form })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Role details updated' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update role' }));
        }
    };

    const togglePermission = async (moduleId: string, granted: boolean) => {
        try {
            if (granted) {
                await dispatch(grantModulesToRole({ roleId: id, moduleIds: [moduleId] })).unwrap();
            } else {
                await dispatch(revokeModulesFromRole({ roleId: id, moduleIds: [moduleId] })).unwrap();
            }
            setGrantedIds((prev) => {
                const next = new Set(prev);
                if (granted) next.add(moduleId);
                else next.delete(moduleId);
                return next;
            });
            dispatch(showToast({ variant: 'success', message: granted ? 'Permission granted' : 'Permission revoked' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update permission' }));
        }
    };

    const handleAddMember = async (userId: string) => {
        try {
            await dispatch(addRoleMember({ roleId: id, userId })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Member assigned' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to assign member' }));
        }
    };

    const handleRemoveMember = async (userId: string) => {
        try {
            await dispatch(removeRoleMember({ roleId: id, userId })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Member removed' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to remove member' }));
        }
    };

    const tabItems = useMemo(
        () => [
            { key: 'details', label: 'Details' },
            { key: 'permissions', label: 'Permissions' },
            { key: 'members', label: 'Members' },
        ],
        []
    );

    if (roleLoading && !role) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb trailingLabel={role?.name} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">
                        Role: <span className="text-primary">{role?.name || '…'}</span>
                    </h1>
                    <p className="text-white-dark">Edit and manage role details, permissions, and members</p>
                </div>
                <Button variant="outline-primary" href="/dashboard/admin/roles">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to Roles
                </Button>
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger">{error}</Alert>
                </div>
            )}

            <div className="panel mt-3">
                <Tabs items={tabItems} active={tab} onChange={(key) => setTab(key as TabKey)} />

                {tab === 'details' && (
                    <form onSubmit={saveDetails} className="max-w-3xl">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input id="roleId" label="Role ID" value={role?.id || ''} disabled readOnly className="bg-white-light/60 dark:bg-dark/40" />
                            <Input id="name" label="Role Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                        </div>
                        <div className="mt-4">
                            <Textarea
                                id="description"
                                label="Description"
                                rows={3}
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving}>
                                {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                )}

                {tab === 'permissions' && (
                    <div>
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h5 className="text-base font-semibold">Permission Settings</h5>
                                <p className="text-sm text-white-dark">
                                    Choose which modules members with the <span className="font-semibold">{role?.name}</span> role can see in their sidebar.
                                </p>
                            </div>
                            <span className="whitespace-nowrap text-sm font-semibold text-white-dark">{grantedIds.size} permissions assigned</span>
                        </div>
                        {permissionsLoading ? (
                            <p className="text-sm text-white-dark">Loading permissions…</p>
                        ) : (
                            <ModulePermissionsAccordion grantedIds={grantedIds} onToggle={togglePermission} disabled={saving} />
                        )}
                    </div>
                )}

                {tab === 'members' && (
                    <GroupMembersPanel members={members} allUsers={users} loading={membersLoading} saving={saving} onAdd={handleAddMember} onRemove={handleRemoveMember} />
                )}
            </div>
        </div>
    );
};

export default RoleDetailPage;
