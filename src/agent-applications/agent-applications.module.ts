import { Module } from '@nestjs/common';
import { AgentApplicationsController } from './agent-applications.controller';
import { AgentApplicationsService } from './agent-applications.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentApplicationsController],
  providers: [AgentApplicationsService],
})
export class AgentApplicationsModule {}
