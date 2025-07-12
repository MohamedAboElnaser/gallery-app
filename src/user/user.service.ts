import { Injectable } from '@nestjs/common';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createUser(data: RegisterDto) {
    return await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password, // Not perfect put works
        name: data.name,
      },
    });
  }
}
