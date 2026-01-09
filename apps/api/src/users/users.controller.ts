import { Controller, Get, Patch, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account and all data' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  async deleteAccount(@Request() req: any) {
    return this.usersService.delete(req.user.id);
  }

  @Get('me/couple')
  @ApiOperation({ summary: 'Get current user couple info' })
  @ApiResponse({ status: 200, description: 'Couple info retrieved' })
  async getCouple(@Request() req: any) {
    return this.usersService.getCouple(req.user.id);
  }
}
