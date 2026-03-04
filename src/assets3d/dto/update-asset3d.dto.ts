// update-asset3d.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAsset3DDto } from './create-asset3d.dto';

export class UpdateAsset3DDto extends PartialType(CreateAsset3DDto) {}
