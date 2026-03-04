// property-image.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PropertyImageService } from './property-images.service';
import { CreatePropertyImageDto } from './dto/create-property-image.dto';
import { UpdatePropertyImageDto } from './dto/update-property-image.dto';

@Controller('property-images')
export class PropertyImageController {
  constructor(private readonly service: PropertyImageService) {}

  @Post()
  create(@Body() dto: CreatePropertyImageDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('propertyId') propertyId?: number) {
    return this.service.findAll(propertyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePropertyImageDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
