import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './user.service';
import { PostsService } from './posts.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService, UsersService, PostsService, PrismaService],
})
export class AppModule {}
