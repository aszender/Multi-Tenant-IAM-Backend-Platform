export class MeResponseDto {
  userId!: string;
  email!: string;
  organizationId!: string;
  role!: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
}
