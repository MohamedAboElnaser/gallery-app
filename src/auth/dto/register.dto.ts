import { IsEmail, Length, IsNotEmpty } from 'class-validator';
export class RegisterDto {
  @IsEmail()
  email: string;

  @Length(8, 20)
  password: string;

  @IsNotEmpty()
  name: string;
}
