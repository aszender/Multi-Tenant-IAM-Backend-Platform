import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsUUID('4')
  organizationId?: string;
}

export class LoginResponseDto {
  userId!: string;
  organizationId!: string;
  role!: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
  accessToken!: string;
  refreshToken!: string;
  tokenType!: 'Bearer';
  expiresInSeconds!: number;
}

export class RefreshTokenRequestDto {
  @IsString()
  @MinLength(32)
  refreshToken!: string;
}

export class RefreshTokenResponseDto extends LoginResponseDto {}

export class LogoutRequestDto {
  @IsString()
  @MinLength(32)
  refreshToken!: string;
}
