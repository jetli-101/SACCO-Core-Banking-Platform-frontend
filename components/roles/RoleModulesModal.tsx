import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchModules, flattenModules } from '@/store/slices/modules/modulesSlice';
import { fetchRoleModules, grantModulesToRole, revokeModulesFromRole } from '@/store/slices/roles/rolesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface RoleModulesModalProps {
    isOpen: boolean;
    roleId: string | null;
    roleName?: string;
    onClose: () => void;
}

// Inverse of ModuleAccessModal: lets a SYSTEM_ADMINISTRATOR pick which modules a given
// role can see, backed by the same Role.modules many-to-many (POST/DELETE
// /roles/{roleId}/modules), just driven from the role side instead of the module side.
const RoleModulesModal = ({ isOpen, roleId, roleName, onClose }: RoleModulesModalProps) => {
    const dispatch = useAppDispatch();
    const { items, itemsLoading } = useAppSelector((state) => state.modules);
    const { saving } = useAppSelector((state) => state.roles);

    const flatModules = useMemo(() => Array.from(flattenModules(items).values()).sort((a, b) => a.name.localeCompare(b.name)), [items]);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [initialSelected, setInitialSelected] = useState<Set<string>>(new Set());
    const [loadingCurrent, setLoadingCurrent] = useState(false);

    useEffect(() => {
        if (!isOpen || !roleId) return;
        dispatch(fetchModules());
        setLoadingCurrent(true);
        dispatch(fetchRoleModules(roleId))
            .unwrap()
            .then((currentModules) => {
                const ids = new Set(currentModules.map((module) => module.id));
                setSelected(ids);
                setInitialSelected(ids);
            })
            .catch(() => undefined)
            .finally(() => setLoadingCurrent(false));
    }, [isOpen, roleId, dispatch]);

    const toggle = (moduleId: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    const handleSave = async () => {
        if (!roleId) return;
        const toGrant = Array.from(selected).filter((id) => !initialSelected.has(id));
        const toRevoke = Array.from(initialSelected).filter((id) => !selected.has(id));
        try {
            if (toGrant.length) await dispatch(grantModulesToRole({ roleId, moduleIds: toGrant })).unwrap();
            if (toRevoke.length) await dispatch(revokeModulesFromRole({ roleId, moduleIds: toRevoke })).unwrap();
            dispatch(showToast({ variant: 'success', message: `Modules updated for "${roleName || 'role'}"` }));
            onClose();
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update role modules' }));
        }
    };

    const loading = itemsLoading || loadingCurrent;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Modules — ${roleName || 'Role'}`} size="sm">
            <p className="mb-4 text-sm text-white-dark">Choose which modules this role can see in their sidebar.</p>

            {loading ? (
                <p className="text-sm text-white-dark">Loading modules…</p>
            ) : flatModules.length === 0 ? (
                <p className="text-sm text-white-dark">No modules exist yet.</p>
            ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {flatModules.map((module) => (
                        <li key={module.id}>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input type="checkbox" className="form-checkbox" checked={selected.has(module.id)} onChange={() => toggle(module.id)} />
                                <span>
                                    <span className="font-medium">{module.name}</span>
                                    {module.urlPath && <span className="block text-xs text-white-dark">{module.urlPath}</span>}
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
                <Button type="button" variant="outline-primary" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving || loading}>
                    {saving ? 'Saving…' : 'Save Modules'}
                </Button>
            </div>
        </Modal>
    );
};

export default RoleModulesModal;
