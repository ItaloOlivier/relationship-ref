import { Controller, Post, Get, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CouplesService } from './couples.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CreateCoupleDto } from './dto/create-couple.dto';
import { JoinCoupleDto } from './dto/join-couple.dto';

@ApiTags('couples')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('couples')
export class CouplesController {
  constructor(private couplesService: CouplesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new couple and get invite code' })
  @ApiBody({ type: CreateCoupleDto })
  @ApiResponse({ status: 201, description: 'Couple created with invite code' })
  @ApiResponse({ status: 409, description: 'User already in a couple' })
  async createCouple(@Request() req: any, @Body() dto: CreateCoupleDto) {
    return this.couplesService.createCouple(req.user.id, dto.name);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join existing couple with invite code' })
  @ApiBody({ type: JoinCoupleDto })
  @ApiResponse({ status: 200, description: 'Joined couple successfully' })
  @ApiResponse({ status: 404, description: 'Invalid invite code' })
  @ApiResponse({ status: 409, description: 'User already in a couple' })
  async joinCouple(@Request() req: any, @Body() dto: JoinCoupleDto) {
    return this.couplesService.joinCouple(req.user.id, dto.inviteCode);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user couple info' })
  @ApiResponse({ status: 200, description: 'Couple info retrieved' })
  async getMyCouple(@Request() req: any) {
    return this.couplesService.getCoupleForUser(req.user.id);
  }

  @Delete('leave')
  @ApiOperation({ summary: 'Leave current couple' })
  @ApiResponse({ status: 200, description: 'Left couple successfully' })
  async leaveCouple(@Request() req: any) {
    return this.couplesService.leaveCouple(req.user.id);
  }
}
