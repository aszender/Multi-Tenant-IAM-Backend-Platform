import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class LoginResponseDto {
  userId!: string;
  organizationId!: string;
  role!: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
  accessToken!: string;
}
