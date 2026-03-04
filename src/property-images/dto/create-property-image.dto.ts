// dto/create-property-image.dto.ts
import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreatePropertyImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsInt()
  width?: number;

  @IsOptional()
  @IsInt()
  height?: number;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsInt()
  propertyId: number; // ID de la propriété associée
}

