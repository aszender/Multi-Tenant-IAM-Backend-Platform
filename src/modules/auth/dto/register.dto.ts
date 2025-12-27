import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsString()
  @IsNotEmpty()
  organizationName!: string;
}

export class RegisterResponseDto {
  userId!: string;
  organizationId!: string;
  accessToken!: string;
}
