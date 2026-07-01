const STAFF_EXCLUDED_ROLE = 'ROLE_MEMBER';

// A user is "staff" (admin/officer/etc.) if they hold any role besides the plain
// member role. Pure ROLE_MEMBER-only accounts get the member dashboard.
export const isStaffRole = (roles?: string[] | null): boolean => (roles ?? []).some((role) => role !== STAFF_EXCLUDED_ROLE);

// "ROLE_LOAN_OFFICER" -> "Loan Officer"
export const humanizeRole = (role: string): string =>
    role
        .replace(/^ROLE_/, '')
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

// Picks the most relevant role to show as a badge — the first non-member role for
// staff, or "Member" as a fallback for plain member accounts.
export const primaryRoleLabel = (roles?: string[] | null): string => {
    const staffRole = (roles ?? []).find((role) => role !== STAFF_EXCLUDED_ROLE);
    return staffRole ? humanizeRole(staffRole) : 'Member';
};
