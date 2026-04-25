import { Transform } from 'class-transformer';
import { IsString, IsInt, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean, Min } from 'class-validator';
import { ListingPurpose, PropertyType, Furnishing, PropertyStatus, RentalMode } from '@prisma/client';
import { toNumberArray, toObjectArray, toStringArray } from './array-transformers';

export class CreatePropertyDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsInt() @Min(0) price!: number;
  @IsEnum(ListingPurpose) purpose!: ListingPurpose;
  @IsOptional() @IsEnum(RentalMode) rentalMode?: RentalMode;
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

  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  features?: number[]; // IDs des features

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  images?: string[]; // URLs des images

  @IsOptional()
  @Transform(({ value }) => toObjectArray<Asset3DDto>(value))
  @IsArray()
  assets3D?: Asset3DDto[];

  @IsOptional()
  @IsInt()
  agentId?: number;

}

export class Asset3DDto {
  @IsString() provider!: string;
  @IsOptional() @IsString() assetUrl?: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() thumbnail?: string;
}

