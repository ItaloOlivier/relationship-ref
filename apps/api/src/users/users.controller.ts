import { Controller, Get, Patch, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
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

  @Get(':userId/profile')
  @ApiOperation({
    summary: 'Get user profile (Phase 5)',
    description: 'View personality profile of any user you share a relationship with. Privacy-controlled.',
  })
  @ApiParam({ name: 'userId', description: 'User ID to view' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 404, description: 'User not found or not in shared relationship' })
  async getUserProfile(@Request() req: any, @Param('userId') userId: string) {
    return this.usersService.getUserProfileWithACL(req.user.id, userId);
  }

  @Get(':userId/profile-in-relationship/:relationshipId')
  @ApiOperation({
    summary: 'Get user profile in specific relationship context (Phase 5)',
    description: 'View personality profile limited to sessions from a specific relationship. Privacy-first.',
  })
  @ApiParam({ name: 'userId', description: 'User ID to view' })
  @ApiParam({ name: 'relationshipId', description: 'Relationship context' })
  @ApiResponse({ status: 200, description: 'Contextual profile retrieved' })
  @ApiResponse({ status: 404, description: 'User or relationship not found' })
  async getUserProfileInRelationship(
    @Request() req: any,
    @Param('userId') userId: string,
    @Param('relationshipId') relationshipId: string,
  ) {
    return this.usersService.getUserProfileInRelationshipContext(
      req.user.id,
      userId,
      relationshipId,
    );
  }
}
