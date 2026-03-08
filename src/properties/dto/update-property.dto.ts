export class UpdatePropertyDto {
  title?: string;
  description?: string;
  price?: number | string;
  cityId?: number | string;
  districtId?: number | string;
  toilets?: number | string;
  features?: number[];
  images?: string[];
  assets3D?: {
    provider: string;
    assetUrl: string;
    title?: string;
    thumbnail?: string;
  }[];
}

// update-property.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
