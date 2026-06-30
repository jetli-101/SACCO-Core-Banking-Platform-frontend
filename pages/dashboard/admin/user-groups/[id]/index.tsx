import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchUserGroupById,
    updateUserGroup,
    fetchGroupModules,
    grantModulesToGroup,
    revokeModulesFromGroup,
    fetchGroupMembers,
    addGroupMember,
    removeGroupMember,
    UserGroupPayload,
} from '@/store/slices/userGroups/userGroupsSlice';
import { fetchModules, fetchModuleTypes } from '@/store/slices/modules/modulesSlice';
import { fetchUsers } from '@/store/slices/users/usersSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Tabs from '@/components/ui/Tabs';
import ModulePermissionsAccordion from '@/components/permissions/ModulePermissionsAccordion';
import GroupMembersPanel from '@/components/permissions/GroupMembersPanel';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';

type TabKey = 'details' | 'permissions' | 'members';

const UserGroupDetailPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const id = typeof router.query.id === 'string' ? router.query.id : '';
    const initialTab = typeof router.query.tab === 'string' ? (router.query.tab as TabKey) : 'details';

    const { groups, members, membersLoading, saving, error } = useAppSelector((state) => state.userGroups);
    const { users } = useAppSelector((state) => state.users);
    const group = groups.find((item) => item.id === id);

    const [tab, setTab] = useState<TabKey>(initialTab);
    const [form, setForm] = useState<UserGroupPayload>({ name: '', description: '' });
    const [grantedIds, setGrantedIds] = useState<Set<string>>(new Set());
    const [permissionsLoading, setPermissionsLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        dispatch(fetchUserGroupById(id));
        dispatch(fetchModules());
        dispatch(fetchModuleTypes());
        dispatch(fetchUsers());
        dispatch(fetchGroupMembers(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (group) setForm({ name: group.name, description: group.description || '' });
    }, [group]);

    useEffect(() => {
        if (!id) return;
        setPermissionsLoading(true);
        dispatch(fetchGroupModules(id))
            .unwrap()
            .then((modules) => setGrantedIds(new Set(modules.map((module) => module.id))))
            .catch(() => undefined)
            .finally(() => setPermissionsLoading(false));
    }, [dispatch, id]);

    const saveDetails = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await dispatch(updateUserGroup({ id, payload: form })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'User group details updated' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update user group' }));
        }
    };

    const togglePermission = async (moduleId: string, granted: boolean) => {
        try {
            if (granted) {
                await dispatch(grantModulesToGroup({ groupId: id, moduleIds: [moduleId] })).unwrap();
            } else {
                await dispatch(revokeModulesFromGroup({ groupId: id, moduleIds: [moduleId] })).unwrap();
            }
            setGrantedIds((prev) => {
                const next = new Set(prev);
                if (granted) next.add(moduleId);
                else next.delete(moduleId);
                return next;
            });
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update permission' }));
        }
    };

    const handleAddMember = async (userId: string) => {
        try {
            await dispatch(addGroupMember({ groupId: id, userId })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Member assigned' }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to assign member' }));
        }
    };

    const handleRemoveMember = async (userId: string) => {
        try {
            await dispatch(removeGroupMember({ groupId: id, userId })).unwrap();
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

    return (
        <div>
            <Breadcrumb trailingLabel={group?.name} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">
                        User Group: <span className="text-primary">{group?.name || '…'}</span>
                    </h1>
                    <p className="text-white-dark">Edit and manage group details, permissions, and members</p>
                </div>
                <Button variant="outline-primary" href="/dashboard/admin/user-groups">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to User Groups
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
                    <form onSubmit={saveDetails} className="max-w-lg space-y-4">
                        <Input id="name" label="Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                        <Input id="description" label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={saving}>
                                {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                )}

                {tab === 'permissions' && (
                    <div>
                        <p className="mb-4 text-sm text-white-dark">
                            Choose which modules members of <span className="font-semibold">{group?.name}</span> can see in their sidebar.
                        </p>
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

export default UserGroupDetailPage;
