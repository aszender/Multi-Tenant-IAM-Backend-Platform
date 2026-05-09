import type { PermissionKey } from '../../../common/authorization/permissions';

export class MeResponseDto {
  userId!: string;
  email!: string;
  organizationId!: string;
  role!: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
  permissions!: PermissionKey[];
}
