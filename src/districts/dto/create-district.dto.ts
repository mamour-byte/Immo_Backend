import { IsString, IsInt } from 'class-validator';

export class CreateDistrictDto {
  @IsString()
  name: string;

  @IsInt()
  cityId: number;
}
