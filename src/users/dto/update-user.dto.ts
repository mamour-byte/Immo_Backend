import { IsOptional, IsString, IsEmail, MinLength, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;
}
