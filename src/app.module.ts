import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';
import { PropertiesModule } from './properties/properties.module';
import { PropertyImageModule } from './property-images/property-images.module';
import { FeaturesModule } from './features/features.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { FavoritesModule } from './favorites/favorites.module';
import { Asset3DModule } from './assets3d/assets3d.module';
import { MessagesModule } from './messages/messages.module';
import { CitiesModule } from './cities/cities.module';
import { DistrictsModule } from './districts/districts.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, AgentsModule, PropertiesModule, PropertyImageModule, FeaturesModule, AppointmentsModule, FavoritesModule, Asset3DModule, MessagesModule, CitiesModule, DistrictsModule, ContactModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
