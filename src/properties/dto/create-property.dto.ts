import { IsString, IsInt, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean, Min } from 'class-validator';
import { ListingPurpose, PropertyType, Furnishing, PropertyStatus } from '@prisma/client';

export class CreatePropertyDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsInt() @Min(0) price!: number;
  @IsEnum(ListingPurpose) purpose!: ListingPurpose;
  @IsEnum(PropertyType) type!: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional() @IsInt() bedrooms?: number;
  @IsOptional() @IsInt() bathrooms?: number;
  @IsOptional() @IsInt() toilets?: number;
  @IsOptional() @IsNumber() surfaceM2?: number;
  @IsOptional() @IsInt() rooms?: number;
  @IsOptional() @IsEnum(Furnishing) furnishing?: Furnishing;

  @IsOptional() @IsInt() cityId?: number;
  @IsOptional() @IsInt() districtId?: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsBoolean() isFeatured?: boolean;

  @IsOptional() @IsArray() features?: number[]; // IDs des features
  @IsOptional() @IsArray() images?: string[]; // URLs des images

  @IsOptional() @IsArray() assets3D?: Asset3DDto[];

  @IsOptional()
  @IsInt()
  agentId?: number;

}

export class Asset3DDto {
  @IsString() provider!: string;
  @IsString() assetUrl!: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() thumbnail?: string;
}

