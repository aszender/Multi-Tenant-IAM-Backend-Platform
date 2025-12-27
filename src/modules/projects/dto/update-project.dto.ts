import { IsOptional, IsString } from 'class-validator';

export class UpdateProjectRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
