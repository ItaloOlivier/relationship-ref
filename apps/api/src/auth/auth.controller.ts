import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('magic-link')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Request a magic link for authentication' })
  @ApiBody({ type: RequestMagicLinkDto })
  @ApiResponse({ status: 200, description: 'Magic link sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Get('verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Verify magic link and get access token' })
  @ApiQuery({ name: 'token', required: true, description: 'Magic link token' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired magic link' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async verifyMagicLink(@Query() dto: VerifyMagicLinkDto) {
    return this.authService.verifyMagicLink(dto.token);
  }

  @Post('demo')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Demo login for testing purposes' })
  @ApiResponse({ status: 200, description: 'Demo login successful' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async demoLogin() {
    return this.authService.demoLogin();
  }
}
