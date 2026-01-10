import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RelationshipsService } from './relationships.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { JoinRelationshipDto } from './dto/join-relationship.dto';
import { LeaveRelationshipDto } from './dto/leave-relationship.dto';
import { UpdateRelationshipStatusDto } from './dto/update-relationship-status.dto';

@ApiTags('relationships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('relationships')
export class RelationshipsController {
  constructor(private relationshipsService: RelationshipsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new relationship',
    description: 'Create a relationship of any type (romantic, friendship, business, etc.). The user is automatically added as the first member.',
  })
  @ApiResponse({ status: 201, description: 'Relationship created' })
  async create(@Request() req: any, @Body() dto: CreateRelationshipDto) {
    return this.relationshipsService.createRelationship(req.user.id, dto);
  }

  @Post('join')
  @ApiOperation({
    summary: 'Join an existing relationship',
    description: 'Join a relationship using an invite code. Users can join multiple relationships.',
  })
  @ApiResponse({ status: 200, description: 'Successfully joined relationship' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  async join(@Request() req: any, @Body() dto: JoinRelationshipDto) {
    return this.relationshipsService.joinRelationship(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all relationships for current user',
    description: 'Returns all active relationships. Set includeEnded=true to also get ended/archived relationships.',
  })
  @ApiQuery({ name: 'includeEnded', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Relationships retrieved' })
  async findAll(
    @Request() req: any,
    @Query('includeEnded') includeEnded?: string,
  ) {
    return this.relationshipsService.getRelationshipsForUser(
      req.user.id,
      includeEnded === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get relationship by ID' })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({ status: 200, description: 'Relationship retrieved' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.relationshipsService.getRelationshipById(id, req.user.id);
  }

  @Delete(':id/leave')
  @ApiOperation({
    summary: 'Leave a relationship',
    description: 'Remove yourself from a relationship. Does not delete the relationship or data.',
  })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({ status: 200, description: 'Successfully left relationship' })
  async leave(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: LeaveRelationshipDto,
  ) {
    return this.relationshipsService.leaveRelationship(
      id,
      req.user.id,
      dto,
    );
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update relationship status',
    description: 'Pause, resume, end, or archive a relationship. Status transitions: ACTIVE ↔ PAUSED → ENDED → ARCHIVED',
  })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRelationshipStatusDto,
  ) {
    return this.relationshipsService.updateRelationshipStatus(
      id,
      req.user.id,
      dto,
    );
  }

  @Get(':id/members')
  @ApiOperation({
    summary: 'Get all members of a relationship',
    description: 'Returns active members with user details. User must be a member to access.',
  })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({ status: 200, description: 'Members retrieved' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async getMembers(@Request() req: any, @Param('id') id: string) {
    return this.relationshipsService.getRelationshipMembers(id, req.user.id);
  }

  @Get(':id/sessions')
  @ApiOperation({
    summary: 'Get all sessions for a relationship',
    description: 'Returns sessions with analysis results, sorted by most recent first.',
  })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async getSessions(@Request() req: any, @Param('id') id: string) {
    return this.relationshipsService.getRelationshipSessions(id, req.user.id);
  }

  @Get(':id/insights')
  @ApiOperation({
    summary: 'Get relationship insights summary',
    description: 'Aggregates patterns from pattern metrics cache. Returns topic frequency, score trends, and horsemen patterns.',
  })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({ status: 200, description: 'Insights retrieved' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async getInsights(@Request() req: any, @Param('id') id: string) {
    return this.relationshipsService.getRelationshipInsights(id, req.user.id);
  }

  @Get(':id/health')
  @ApiOperation({
    summary: 'Get relationship health metrics',
    description: 'Calculates health score, trend, emotional bank balance, and card ratios based on recent sessions.',
  })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({ status: 200, description: 'Health metrics retrieved' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async getHealth(@Request() req: any, @Param('id') id: string) {
    return this.relationshipsService.getRelationshipHealth(id, req.user.id);
  }
}
