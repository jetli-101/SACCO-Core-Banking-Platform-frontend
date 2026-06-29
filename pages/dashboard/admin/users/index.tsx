import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, clearUsersError, AppUser } from '@/store/slices/users/usersSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Breadcrumb from '@/components/ui/Breadcrumb';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconUsers from '@/components/Icon/IconUsers';

const statusBadgeClass: Record<string, string> = {
    ACTIVE: 'bg-success-light text-success',
    PENDING: 'bg-warning-light text-warning',
    SUSPENDED: 'bg-danger-light text-danger',
    LOCKED: 'bg-danger-light text-danger',
    DEACTIVATED: 'bg-white-light text-white-dark dark:bg-dark/40',
    INACTIVE: 'bg-white-light text-white-dark dark:bg-dark/40',
    REJECTED: 'bg-danger-light text-danger',
};

const UsersPage = () => {
    const dispatch = useAppDispatch();
    const { users, loading, error } = useAppSelector((state) => state.users);

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Configuration' }, { label: 'Users' }]} />

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-white-dark">Every staff and member account in your Sacco</p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-sm">
                <StatCard label="Total Users" value={users.length} icon={<IconUsers className="h-4 w-4" />} />
            </div>

            {error && (
                <div className="mt-5">
                    <Alert variant="danger" onClose={() => dispatch(clearUsersError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <div className="panel mt-5">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold">User Accounts</h5>
                    <p className="text-sm text-white-dark">Read-only listing — manage roles and group membership from Roles or User Groups</p>
                </div>

                <DataGrid
                    columns={[
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
                    toolbarActions={
                        <Button variant="outline-primary" size="sm" onClick={() => dispatch(fetchUsers())}>
                            <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Refresh
                        </Button>
                    }
                />
            </div>
        </div>
    );
};

export default UsersPage;
