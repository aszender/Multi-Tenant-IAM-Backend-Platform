export type OrganizationListItemDto = {
  organizationId: string;
  name: string;
  role: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
};

export class ListOrganizationsResponseDto {
  organizations!: OrganizationListItemDto[];
}
