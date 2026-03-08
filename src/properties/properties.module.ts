import { Module } from '@nestjs/common';
import { PropertyController } from './properties.controller';
import { PropertyService } from './properties.service';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [AuthModule],
  controllers: [PropertyController],
  providers: [PropertyService , PropertyFilterDto , PrismaService]
})



export class PropertiesModule {}
