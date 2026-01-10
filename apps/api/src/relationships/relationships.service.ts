import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { JoinRelationshipDto } from './dto/join-relationship.dto';
import { LeaveRelationshipDto } from './dto/leave-relationship.dto';
import { UpdateRelationshipStatusDto } from './dto/update-relationship-status.dto';
import { RelationshipStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class RelationshipsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique invite code
   */
  private generateInviteCode(): string {
    return nanoid(10).toUpperCase();
  }

  /**
   * Create a new relationship
   * - No longer restricts users to one relationship
   * - User is automatically added as the first member
   * - Creates a lifecycle event for CREATED
   */
  async createRelationship(userId: string, dto: CreateRelationshipDto) {
    const inviteCode = this.generateInviteCode();

    const relationship = await this.prisma.relationship.create({
      data: {
        type: dto.type || 'ROMANTIC_COUPLE',
        name: dto.name,
        inviteCode,
        members: {
          create: {
            userId,
            joinedAt: new Date(),
          },
        },
        lifecycleEvents: {
          create: {
            eventType: 'CREATED',
            triggeredByUserId: userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return relationship;
  }

  /**
   * Join an existing relationship via invite code
   * - Users can join multiple relationships
   * - Creates a lifecycle event for MEMBER_JOINED
   */
  async joinRelationship(userId: string, dto: JoinRelationshipDto) {
    const relationship = await this.prisma.relationship.findUnique({
      where: { inviteCode: dto.inviteCode },
      include: {
        members: true,
      },
    });

    if (!relationship) {
      throw new NotFoundException('Relationship not found with that invite code');
    }

    if (relationship.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot join a ${relationship.status.toLowerCase()} relationship`,
      );
    }

    // Check if user is already a member
    const existingMember = relationship.members.find(
      (m: { userId: string; leftAt: Date | null }) => m.userId === userId && m.leftAt === null,
    );

    if (existingMember) {
      throw new ConflictException('You are already a member of this relationship');
    }

    // Add user as a member
    await this.prisma.relationshipMember.create({
      data: {
        relationshipId: relationship.id,
        userId,
        role: dto.role,
        joinedAt: new Date(),
      },
    });

    // Create lifecycle event
    await this.prisma.relationshipLifecycleEvent.create({
      data: {
        relationshipId: relationship.id,
        eventType: 'MEMBER_JOINED',
        triggeredByUserId: userId,
        metadata: dto.role ? { role: dto.role } : undefined,
      },
    });

    return this.getRelationshipById(relationship.id, userId);
  }

  /**
   * Get all relationships for a user (not just one)
   * - Returns only active memberships by default
   * - Includes all relationship members
   */
  async getRelationshipsForUser(
    userId: string,
    includeEnded: boolean = false,
  ) {
    const where: any = {
      members: {
        some: {
          userId,
          leftAt: null, // Only active memberships
        },
      },
    };

    if (!includeEnded) {
      where.status = 'ACTIVE';
    }

    const relationships = await this.prisma.relationship.findMany({
      where,
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return relationships;
  }

  /**
   * Get a specific relationship by ID
   * - Verifies user is a member
   */
  async getRelationshipById(relationshipId: string, userId: string) {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        emotionalBankLedger: true,
        _count: {
          select: {
            sessions: true,
            quests: true,
          },
        },
      },
    });

    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    // Verify user is a member
    const isMember = relationship.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) {
      throw new NotFoundException('Relationship not found');
    }

    return relationship;
  }

  /**
   * Leave a relationship
   * - Marks the membership as ended (leftAt timestamp)
   * - Creates a lifecycle event for MEMBER_LEFT
   * - Does NOT delete the relationship or data
   */
  async leaveRelationship(
    relationshipId: string,
    userId: string,
    dto: LeaveRelationshipDto,
  ) {
    const relationship = await this.getRelationshipById(relationshipId, userId);

    const member = relationship.members.find((m: { userId: string; id: string }) => m.userId === userId);
    if (!member) {
      throw new NotFoundException('You are not a member of this relationship');
    }

    // Mark membership as ended
    await this.prisma.relationshipMember.update({
      where: { id: member.id },
      data: {
        leftAt: new Date(),
      },
    });

    // Create lifecycle event
    await this.prisma.relationshipLifecycleEvent.create({
      data: {
        relationshipId,
        eventType: 'MEMBER_LEFT',
        triggeredByUserId: userId,
        reason: dto.reason,
      },
    });

    return { success: true, message: 'Successfully left the relationship' };
  }

  /**
   * Update relationship status (pause, resume, end)
   * - ACTIVE → PAUSED (pause)
   * - PAUSED → ACTIVE (resume)
   * - ACTIVE/PAUSED → ENDED_MUTUAL/ENDED_UNILATERAL (end)
   * - ENDED → ARCHIVED (archive)
   */
  async updateRelationshipStatus(
    relationshipId: string,
    userId: string,
    dto: UpdateRelationshipStatusDto,
  ) {
    const relationship = await this.getRelationshipById(relationshipId, userId);

    // Validate status transition
    this.validateStatusTransition(relationship.status, dto.status);

    const updateData: any = {
      status: dto.status,
      updatedAt: new Date(),
    };

    // Set endedAt for ENDED statuses
    if (
      dto.status === 'ENDED_MUTUAL' ||
      dto.status === 'ENDED_UNILATERAL'
    ) {
      updateData.endedAt = new Date();
      updateData.endReason = dto.reason;

      // Mark all members as left
      await this.prisma.relationshipMember.updateMany({
        where: {
          relationshipId,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      });
    }

    // Update relationship
    await this.prisma.relationship.update({
      where: { id: relationshipId },
      data: updateData,
    });

    // Create lifecycle event
    let eventType = dto.status;
    if (dto.status === 'ACTIVE' && relationship.status === 'PAUSED') {
      eventType = 'RESUMED' as any;
    }

    await this.prisma.relationshipLifecycleEvent.create({
      data: {
        relationshipId,
        eventType: eventType as string,
        triggeredByUserId: userId,
        reason: dto.reason,
      },
    });

    return this.getRelationshipById(relationshipId, userId);
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(
    currentStatus: RelationshipStatus,
    newStatus: RelationshipStatus,
  ) {
    const validTransitions: Record<RelationshipStatus, RelationshipStatus[]> = {
      ACTIVE: ['PAUSED', 'ENDED_MUTUAL', 'ENDED_UNILATERAL'],
      PAUSED: ['ACTIVE', 'ENDED_MUTUAL', 'ENDED_UNILATERAL'],
      ENDED_MUTUAL: ['ARCHIVED'],
      ENDED_UNILATERAL: ['ARCHIVED'],
      ARCHIVED: [], // Cannot transition from archived
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Backward compatibility: Get couple-style data
   * Returns the first ROMANTIC_COUPLE relationship for a user
   */
  async getCoupleForUser(userId: string) {
    const relationships = await this.getRelationshipsForUser(userId);

    // Find first romantic couple
    const couple = relationships.find(
      (r: { type: string }) => r.type === 'ROMANTIC_COUPLE',
    );

    if (!couple) {
      return null;
    }

    // Transform to couple-like structure for backward compatibility
    const members = couple.members;
    return {
      ...couple,
      partner1Id: members[0]?.userId,
      partner2Id: members[1]?.userId,
      partner1: members[0]?.user,
      partner2: members[1]?.user,
    };
  }
}
