import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateProjectResponseDto {
  projectId!: string;
}
