// create-property-with-images.dto.ts
import { IsString, IsInt, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean, Min } from 'class-validator';
import { ListingPurpose, PropertyType, Furnishing, PropertyStatus, RentalMode } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreatePropertyWithImagesDto {
  @IsString() title!: string;
  @IsString() description!: string;
  
  @Transform(({ value }) => Number(value))
  @IsInt() @Min(0) price!: number;
  
  @IsEnum(ListingPurpose) purpose!: ListingPurpose;
  @IsOptional() @IsEnum(RentalMode) rentalMode?: RentalMode;
  @IsEnum(PropertyType) type!: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsInt() bedrooms?: number;
  
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsInt() bathrooms?: number;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsInt() toilets?: number;
  
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsNumber() surfaceM2?: number;
  
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsInt() rooms?: number;
  
  @IsOptional() @IsEnum(Furnishing) furnishing?: Furnishing;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsInt() cityId?: number;
  
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsInt() districtId?: number;
  
  @IsOptional() @IsString() address?: string;
  
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsNumber() latitude?: number;
  
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsNumber() longitude?: number;
  
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean() isFeatured?: boolean;

  @IsOptional() @IsArray() features?: number[]; // IDs des features
  
  // Les images sont gérées par l'intercepteur de fichiers, pas par le DTO
  // Les fichiers seront disponibles via @UploadedFiles()

  @IsOptional() @IsArray() assets3D?: Asset3DDto[];
}

export class Asset3DDto {
  @IsString() provider!: string;
  @IsString() assetUrl!: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() thumbnail?: string;
}
