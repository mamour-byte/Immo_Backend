import { Module } from '@nestjs/common';
import { AgentApplicationsController } from './agent-applications.controller';
import { AgentApplicationsService } from './agent-applications.service';

@Module({
  controllers: [AgentApplicationsController],
  providers: [AgentApplicationsService],
})
export class AgentApplicationsModule {}

