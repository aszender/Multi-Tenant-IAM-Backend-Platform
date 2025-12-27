import { IsIn } from 'class-validator';

export class UpdateUserRoleRequestDto {
  @IsIn(['ORG_ADMIN', 'ORG_USER', 'READ_ONLY'])
  role!: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
}
