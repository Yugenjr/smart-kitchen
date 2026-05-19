import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

type AuthResult = {
  accessToken: string;
  user: Omit<User, 'password'>;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResult> {
    const existingUser = await this.userRepository.findOneBy({
      email: signupDto.email,
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create({
      name: signupDto.name,
      email: signupDto.email,
      password: await hash(signupDto.password, 10),
    });

    await this.userRepository.save(user);

    return this.buildAuthResult(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResult(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      return null;
    }

    const isPasswordValid = await compare(password, user.password);

    return isPasswordValid ? user : null;
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  private buildAuthResult(user: User): AuthResult {
    const { password, ...safeUser } = user;

    return {
      accessToken: this.generateToken(user),
      user: safeUser,
    };
  }
}