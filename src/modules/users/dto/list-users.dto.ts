export type OrganizationMemberDto = {
  userId: string;
  email: string;
  role: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
  joinedAt: string;
};

export class ListUsersResponseDto {
  members!: OrganizationMemberDto[];
}
