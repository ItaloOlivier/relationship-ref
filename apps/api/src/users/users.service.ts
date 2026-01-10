import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        coupleAsPartner1: true,
        coupleAsPartner2: true,
        streaks: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    // This will cascade delete related data due to Prisma schema
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Account deleted successfully' };
  }

  async getCouple(userId: string) {
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [
          { partner1Id: userId },
          { partner2Id: userId },
        ],
      },
      include: {
        partner1: { select: { id: true, name: true, email: true } },
        partner2: { select: { id: true, name: true, email: true } },
      },
    });

    return couple;
  }

  /**
   * Get user profile with ACL check (Phase 5)
   * - Verifies both users share at least one relationship
   * - Returns personality profile and basic user info
   */
  async getUserProfileWithACL(requestingUserId: string, targetUserId: string) {
    // Check if users share any relationship
    const sharedRelationships = await this.prisma.relationship.findMany({
      where: {
        status: 'ACTIVE',
        members: {
          some: {
            userId: requestingUserId,
            leftAt: null,
          },
        },
      },
      include: {
        members: {
          where: {
            leftAt: null,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    // Check if target user is in any of these relationships
    const hasSharedRelationship = sharedRelationships.some((rel: any) =>
      rel.members.some((m: any) => m.userId === targetUserId),
    );

    if (!hasSharedRelationship) {
      throw new NotFoundException('User not found or not in a shared relationship');
    }

    // Get target user basic info
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Get personality profile
    const personalityProfile = await this.prisma.personalityProfile.findUnique({
      where: { userId: targetUserId },
    });

    return {
      user: targetUser,
      personalityProfile: personalityProfile || null,
      sharedRelationships: sharedRelationships.map((rel: any) => ({
        id: rel.id,
        type: rel.type,
        name: rel.name,
      })),
    };
  }

  /**
   * Get user profile in specific relationship context (Phase 5)
   * - Verifies both users are members of the specified relationship
   * - Returns personality metrics computed ONLY from sessions in that relationship
   */
  async getUserProfileInRelationshipContext(
    requestingUserId: string,
    targetUserId: string,
    relationshipId: string,
  ) {
    // Verify relationship exists and both users are members
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        members: {
          where: {
            leftAt: null,
          },
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    const memberUserIds = relationship.members.map((m: any) => m.userId);

    if (
      !memberUserIds.includes(requestingUserId) ||
      !memberUserIds.includes(targetUserId)
    ) {
      throw new NotFoundException('User not found in this relationship');
    }

    // Get target user basic info
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Get sessions for this relationship
    const sessions = await this.prisma.session.findMany({
      where: {
        relationshipId,
        status: 'COMPLETED',
      },
      include: {
        analysisResult: {
          select: {
            individualScores: true,
          },
        },
      },
    });

    // Extract individual scores for target user across all sessions
    const userIndividualScores: any[] = [];
    for (const session of sessions) {
      const individualScores =
        (session.analysisResult?.individualScores as any[]) || [];
      const userScore = individualScores.find(
        (score: any) => score.userId === targetUserId,
      );
      if (userScore) {
        userIndividualScores.push(userScore);
      }
    }

    // Calculate aggregated metrics
    const totalSessions = userIndividualScores.length;
    const avgPersonalScore =
      totalSessions > 0
        ? userIndividualScores.reduce(
            (sum, s) => sum + (s.personalScore || 0),
            0,
          ) / totalSessions
        : null;

    const totalGreen = userIndividualScores.reduce(
      (sum, s) => sum + (s.greenCardCount || 0),
      0,
    );
    const totalYellow = userIndividualScores.reduce(
      (sum, s) => sum + (s.yellowCardCount || 0),
      0,
    );
    const totalRed = userIndividualScores.reduce(
      (sum, s) => sum + (s.redCardCount || 0),
      0,
    );

    const allHorsemen = userIndividualScores.flatMap(
      (s) => s.horsemenUsed || [],
    );
    const uniqueHorsemen = [...new Set(allHorsemen)];

    const totalRepairAttempts = userIndividualScores.reduce(
      (sum, s) => sum + (s.repairAttemptCount || 0),
      0,
    );

    return {
      user: targetUser,
      relationshipContext: {
        relationshipId,
        relationshipType: relationship.type,
        relationshipName: relationship.name,
      },
      metrics: {
        sessionsCount: totalSessions,
        avgPersonalScore: avgPersonalScore
          ? Math.round(avgPersonalScore)
          : null,
        totalGreenCards: totalGreen,
        totalYellowCards: totalYellow,
        totalRedCards: totalRed,
        horsemenUsed: uniqueHorsemen,
        totalRepairAttempts,
      },
    };
  }
}
