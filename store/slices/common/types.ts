// Matches GroupMemberResponse on the backend — a user's membership row in either a
// Role's or a UserGroup's "Members" tab. Shared since both slices use the identical shape.
export interface GroupMember {
    id: string;
    userId: string;
    username: string;
    email: string;
}
