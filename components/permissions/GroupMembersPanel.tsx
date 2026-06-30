import { useState } from 'react';
import { GroupMember } from '@/store/slices/common/types';
import { AppUser } from '@/store/slices/users/usersSlice';
import DataGrid from '@/components/ui/DataGrid';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Spinner from '@/components/ui/Spinner';
import IconUserPlus from '@/components/Icon/IconUserPlus';

interface GroupMembersPanelProps {
    members: GroupMember[];
    allUsers: AppUser[];
    loading?: boolean;
    saving?: boolean;
    onAdd: (userId: string) => Promise<void> | void;
    onRemove: (userId: string) => Promise<void> | void;
}

// Shared by the Role and UserGroup detail pages' "Members" tab.
const GroupMembersPanel = ({ members, allUsers, loading, saving, onAdd, onRemove }: GroupMembersPanelProps) => {
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');

    const memberUserIds = new Set(members.map((member) => member.userId));
    const availableUsers = allUsers.filter((user) => !memberUserIds.has(user.id));

    const openAssign = () => {
        setSelectedUserId(availableUsers[0]?.id || '');
        setAssignOpen(true);
    };

    const submitAssign = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedUserId) return;
        await onAdd(selectedUserId);
        setAssignOpen(false);
    };

    return (
        <div>
            <DataGrid
                panel={false}
                title="Assigned Members"
                count={members.length}
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: GroupMember) => <RowActionsMenu onDelete={() => onRemove(row.userId)} label={`Remove ${row.username}`} />,
                    },
                    { header: 'Username', accessor: 'username' },
                    { header: 'Email', accessor: 'email' },
                ]}
                data={members}
                rowKey={(row) => row.id}
                searchKeys={['username', 'email']}
                searchPlaceholder="Search members..."
                loading={loading}
                emptyMessage="No members assigned yet"
                toolbarActions={
                    <Button size="sm" onClick={openAssign} disabled={availableUsers.length === 0}>
                        <IconUserPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Assign Member
                    </Button>
                }
            />

            <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Member">
                <form onSubmit={submitAssign} className="space-y-4">
                    <div className="w-full">
                        <label htmlFor="userId" className="mb-1.5 block text-sm font-semibold">
                            User *
                        </label>
                        <select id="userId" className="form-select" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required>
                            {availableUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.username} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setAssignOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving || !selectedUserId}>
                            {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {saving ? 'Assigning…' : 'Assign'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GroupMembersPanel;
