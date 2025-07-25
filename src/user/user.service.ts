import { Injectable, ConflictException } from '@nestjs/common';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createUser(data: RegisterDto) {
    //make sure that email is not used
    let user;
    user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (user) throw new ConflictException('Email already exists');
    user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password, // Not perfect put works
        name: data.name,
      },
    });
    // Exclude password from the returned user object
    const { password, ...result } = user;
    return result;
  }
}
