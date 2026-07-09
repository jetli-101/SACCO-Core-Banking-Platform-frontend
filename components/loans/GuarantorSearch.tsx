import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { resolveFileUrl } from '@/urlhelper';
import { Guarantor } from '@/store/slices/loans/guarantorsSlice';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconSearch from '@/components/Icon/IconSearch';
import IconPlus from '@/components/Icon/IconPlus';
import IconTrash from '@/components/Icon/IconTrash';
import Input from '../ui/Input';

const statusVariant: Record<Guarantor['status'], 'success' | 'warning' | 'danger'> = {
    ACCEPTED: 'success',
    PENDING: 'warning',
    DECLINED: 'danger',
};

interface GuarantorSearchProps {
    currentMemberId?: string;
    guarantors: Guarantor[];
    onAdd: (memberId: string) => void;
    onRemove: (guarantorId: string) => void;
    disabled?: boolean;
}

// Avatar-based member search for inviting guarantors on a loan application — real member
// directory data (GET /members has no role restriction), search-as-you-type, with the
// invited list shown below as status chips (Pending/Accepted/Declined).
const GuarantorSearch = ({ currentMemberId, guarantors, onAdd, onRemove, disabled }: GuarantorSearchProps) => {
    const { members } = useAppSelector((state) => state.members);
    const [search, setSearch] = useState('');

    const guarantorMemberIds = new Set(guarantors.map((g) => g.memberId));
    const term = search.trim().toLowerCase();

    const results =
        term.length === 0
            ? []
            : members
                  .filter((member) => member.id !== currentMemberId && !guarantorMemberIds.has(member.id))
                  .filter((member) => {
                      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
                      return fullName.includes(term) || (member.memberNumber || '').toLowerCase().includes(term);
                  })
                  .slice(0, 6);

    return (
        <div>
            <div className="relative">
                <Input
                    type="text"
                    className="form-input pr-10"
                    placeholder="Search members by name or member number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={disabled}
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white-dark">
                    <IconSearch className="h-4 w-4" />
                </span>
            </div>

            {results.length > 0 && (
                <div className="mt-2 space-y-1 rounded-md border border-white-light p-2 dark:border-white/10">
                    {results.map((member) => (
                        <div key={member.id} className="flex items-center justify-between gap-2 rounded-md p-1.5 hover:bg-white-light/60 dark:hover:bg-white/5">
                            <div className="flex items-center gap-2.5">
                                <Avatar src={resolveFileUrl(member.passportPhotoUrl)} name={`${member.firstName} ${member.lastName}`} size="sm" />
                                <div>
                                    <div className="text-sm font-semibold">
                                        {member.firstName} {member.lastName}
                                    </div>
                                    <div className="text-xs text-white-dark">{member.memberNumber || '—'}</div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline-primary"
                                onClick={() => {
                                    onAdd(member.id);
                                    setSearch('');
                                }}
                            >
                                <IconPlus className="h-3.5 w-3.5 shrink-0 ltr:mr-1 rtl:ml-1" />
                                Invite
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 space-y-2">
                {guarantors.length === 0 ? (
                    <p className="text-sm text-white-dark">No guarantors invited yet — search above to invite one.</p>
                ) : (
                    guarantors.map((guarantor) => (
                        <div key={guarantor.id} className="flex items-center justify-between gap-2 rounded-md border border-white-light p-2.5 dark:border-white/10">
                            <div className="flex items-center gap-2.5">
                                <Avatar src={resolveFileUrl(guarantor.memberAvatarUrl)} name={guarantor.memberName} size="sm" />
                                <div>
                                    <div className="text-sm font-semibold">{guarantor.memberName}</div>
                                    <div className="text-xs text-white-dark">{guarantor.memberNumber || '—'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={statusVariant[guarantor.status]}>{guarantor.status}</Badge>
                                {guarantor.status === 'PENDING' && !disabled && (
                                    <Button type="button" className="text-white-dark hover:text-danger" onClick={() => onRemove(guarantor.id)} aria-label="Remove guarantor">
                                        <IconTrash className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GuarantorSearch;
