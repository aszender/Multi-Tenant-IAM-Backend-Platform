import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { AuthService } from './auth.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  LogoutRequestDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
} from './dto/login.dto';
import { MeResponseDto } from './dto/me.dto';
import { RegisterRequestDto, RegisterResponseDto } from './dto/register.dto';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from './types/authenticated-request-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
  async register(@Body() dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(AuthRateLimitGuard)
  async refresh(@Body() dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @UseGuards(AuthRateLimitGuard)
  async logout(@Body() dto: LogoutRequestDto) {
    return this.authService.logout(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedRequestUser): MeResponseDto {
    return {
      userId: user.userId,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      permissions: user.permissions,
    };
  }
}
