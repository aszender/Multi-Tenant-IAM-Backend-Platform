import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must include lowercase, uppercase, and numeric characters',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  organizationName!: string;
}

export class RegisterResponseDto {
  userId!: string;
  organizationId!: string;
  accessToken!: string;
  refreshToken!: string;
  tokenType!: 'Bearer';
  expiresInSeconds!: number;
}
