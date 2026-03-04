import { IsEmail, IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateContactDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsInt()
  propertyId?: number;
}
