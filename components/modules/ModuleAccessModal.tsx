import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRoles, fetchModuleRoles, grantModuleToRoles, revokeModuleFromRoles } from '@/store/slices/roles/rolesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface ModuleAccessModalProps {
    isOpen: boolean;
    moduleId: string | null;
    moduleName?: string;
    onClose: () => void;
}

// Lets a SYSTEM_ADMINISTRATOR pick which role groups can see a module in their sidebar —
// backed by the existing Role.modules many-to-many (POST/DELETE /roles/{roleId}/modules),
// reused as the "user group" access list rather than introducing a separate group entity.
const ModuleAccessModal = ({ isOpen, moduleId, moduleName, onClose }: ModuleAccessModalProps) => {
    const dispatch = useAppDispatch();
    const { roles, rolesLoading, saving } = useAppSelector((state) => state.roles);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [initialSelected, setInitialSelected] = useState<Set<string>>(new Set());
    const [loadingCurrent, setLoadingCurrent] = useState(false);

    useEffect(() => {
        if (!isOpen || !moduleId) return;
        dispatch(fetchRoles());
        setLoadingCurrent(true);
        dispatch(fetchModuleRoles(moduleId))
            .unwrap()
            .then((currentRoles) => {
                const ids = new Set(currentRoles.map((role) => role.id));
                setSelected(ids);
                setInitialSelected(ids);
            })
            .catch(() => undefined)
            .finally(() => setLoadingCurrent(false));
    }, [isOpen, moduleId, dispatch]);

    const toggle = (roleId: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(roleId)) next.delete(roleId);
            else next.add(roleId);
            return next;
        });
    };

    const handleSave = async () => {
        if (!moduleId) return;
        const toGrant = Array.from(selected).filter((id) => !initialSelected.has(id));
        const toRevoke = Array.from(initialSelected).filter((id) => !selected.has(id));
        try {
            if (toGrant.length) await dispatch(grantModuleToRoles({ moduleId, roleIds: toGrant })).unwrap();
            if (toRevoke.length) await dispatch(revokeModuleFromRoles({ moduleId, roleIds: toRevoke })).unwrap();
            dispatch(showToast({ variant: 'success', message: `Access updated for "${moduleName || 'module'}"` }));
            onClose();
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update module access' }));
        }
    };

    const loading = rolesLoading || loadingCurrent;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Access — ${moduleName || 'Module'}`} size="sm">
            <p className="mb-4 text-sm text-white-dark">Choose which role groups can see this module in their sidebar.</p>

            {loading ? (
                <p className="text-sm text-white-dark">Loading roles…</p>
            ) : roles.length === 0 ? (
                <p className="text-sm text-white-dark">No roles exist yet.</p>
            ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {roles.map((role) => (
                        <li key={role.id}>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input type="checkbox" className="form-checkbox" checked={selected.has(role.id)} onChange={() => toggle(role.id)} />
                                <span>
                                    <span className="font-medium">{role.name}</span>
                                    {role.description && <span className="block text-xs text-white-dark">{role.description}</span>}
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
                    {saving ? 'Saving…' : 'Save Access'}
                </Button>
            </div>
        </Modal>
    );
};

export default ModuleAccessModal;
