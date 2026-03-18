import {
  IsOptional,
  IsInt,
  IsEnum,
  IsString,
  IsArray,
  IsNumber,
  IsIn,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ListingPurpose, PropertyType, PropertyStatus, RentalMode } from '@prisma/client';

export class PropertyFilterDto {
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(ListingPurpose)
  purpose?: ListingPurpose;

  @IsOptional()
  @IsEnum(RentalMode)
  rentalMode?: RentalMode;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsInt()
  cityId?: number;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsInt()
  districtId?: number;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsInt()
  bedrooms?: number;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsInt()
  bathrooms?: number;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  minSurface?: number;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  maxSurface?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
        return value
          .split(',')
          .map((v) => Number(v.trim()))
          .filter((n) => !Number.isNaN(n));
    }
    return value;
  })
  @IsArray()
  @IsInt({ each: true }) 
  features?: number[];

  @IsOptional()
  @IsString()
  @MinLength(3)
  search?: string;

  // --- Pagination ---
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 1)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 20)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
