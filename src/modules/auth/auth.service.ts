import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {User} from "../users/entities/user.entity";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import * as bcrypt from 'bcrypt';
import {CreateUserDto} from "./dto/create-user.dto";
import {LoginUserDto} from "./dto/login-user.dto";
import {JwtService} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";



@Injectable()
export class AuthService {
  constructor(
      @InjectRepository(User) private authRepository: Repository<User>,
      private jwtService: JwtService,
      private configService: ConfigService,
  ) {}


  async create(dto: CreateUserDto) {
    const existingUser = await this.authRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.authRepository.create({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
    });

    const savedUser = await this.authRepository.save(user);

    const payload = { userId: savedUser.id, username: savedUser.username, email: savedUser.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '2h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const { password, ...userData } = savedUser;

    return {
      user: userData,
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginUserDto) {
    const user = await this.authRepository.findOne({
      where: {email: dto.email},
      select: ['id', 'username', 'password'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: user.id, username: user.username, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '2h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const { password, ...userData } = user;
    return { user: userData, accessToken, refreshToken };
  }

}
