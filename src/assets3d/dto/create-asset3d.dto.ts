// create-asset3d.dto.ts
import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateAsset3DDto {
  @IsInt() propertyId!: number;
  @IsOptional() @IsString() title?: string;
  @IsString() provider!: string;
  @IsOptional() @IsString() assetUrl?: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() thumbnail?: string;
}

