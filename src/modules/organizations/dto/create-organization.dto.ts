import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganizationRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class CreateOrganizationResponseDto {
  organizationId!: string;
}
