import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { Asset3DService } from './assets3d.service';
import { CreateAsset3DDto } from './dto/create-asset3d.dto';
import { UpdateAsset3DDto } from './dto/update-asset3d.dto';

@Controller('assets3d')
export class Asset3DController {
  constructor(private readonly asset3DService: Asset3DService) {}

  @Post()
  create(@Body() dto: CreateAsset3DDto) {
    return this.asset3DService.create(dto);
  }

  @Get()
  findAll() {
    return this.asset3DService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asset3DService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAsset3DDto) {
    return this.asset3DService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asset3DService.remove(id);
  }
}
