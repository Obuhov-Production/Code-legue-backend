import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {User} from "../users/entities/user.entity";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import * as bcrypt from 'bcrypt';
import {CreateUserDto} from "./dto/create-user.dto";
import {LoginUserDto} from "./dto/login-user.dto";



@Injectable()
export class AuthService {
  constructor(
      @InjectRepository(User) private authRepository: Repository<User>,
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

    const { password, ...userData } = savedUser;

    return userData;
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

    const { password, ...userData } = user;
    return userData;
  }

}
