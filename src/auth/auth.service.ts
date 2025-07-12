import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async register(data: RegisterDto) {
    return await this.userService.createUser(data);
  }

  async login(loginData: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginData.email, password: loginData.password },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate and return JWT
    const token = this.generateJwt(user.id, user.email);
    return { token };
  }

  private generateJwt(id: string | number, email: string) {
    const payload = { sub: id, email };
    return this.jwtService.sign(payload);
  }
}
