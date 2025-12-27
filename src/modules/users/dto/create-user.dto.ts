import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsOptional()
  @IsIn(['ORG_ADMIN', 'ORG_USER', 'READ_ONLY'])
  role?: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
}

export class CreateUserResponseDto {
  userId!: string;
}
