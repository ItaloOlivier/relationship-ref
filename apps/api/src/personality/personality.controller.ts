import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ProfileAggregatorService } from './profile-aggregator.service';
import { PrismaService } from '@/common/prisma/prisma.service';

@ApiTags('personality')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('personality')
export class PersonalityController {
  constructor(
    private profileAggregator: ProfileAggregatorService,
    private prisma: PrismaService,
  ) {}

  @Get('profile/me')
  @ApiOperation({ summary: 'Get current user personality profile' })
  @ApiResponse({ status: 200, description: 'Personality profile retrieved' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(@Request() req: any) {
    const profile = await this.profileAggregator.getPersonalityProfile(req.user.id);
    if (!profile) {
      throw new NotFoundException('No personality profile found. Import some chat data first.');
    }
    return profile;
  }

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get personality profile for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Personality profile retrieved' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getUserProfile(@Param('userId') userId: string, @Request() req: any) {
    // Get current user's couple
    const currentUserCouple = await this.getUserCouple(req.user.id);

    // Get target user's couple
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const targetUserCouple = await this.getUserCouple(userId);

    // Only allow viewing partner's profile (same couple)
    if (!currentUserCouple || !targetUserCouple || currentUserCouple.id !== targetUserCouple.id) {
      throw new NotFoundException('Profile not found');
    }

    const profile = await this.profileAggregator.getPersonalityProfile(userId);
    if (!profile) {
      throw new NotFoundException('No personality profile found for this user.');
    }
    return profile;
  }

  @Get('evolution/me')
  @ApiOperation({ summary: 'Get personality evolution over time' })
  @ApiResponse({ status: 200, description: 'Profile evolution retrieved' })
  async getMyEvolution(@Request() req: any) {
    return this.profileAggregator.getProfileEvolution(req.user.id);
  }

  @Get('couple')
  @ApiOperation({ summary: 'Get relationship dynamics for current couple' })
  @ApiResponse({ status: 200, description: 'Relationship dynamics retrieved' })
  @ApiResponse({ status: 404, description: 'No couple or dynamics found' })
  async getCoupleAnalysis(@Request() req: any) {
    const couple = await this.getUserCouple(req.user.id);

    if (!couple) {
      throw new NotFoundException('You are not part of a couple yet.');
    }

    const dynamics = await this.profileAggregator.getRelationshipDynamic(couple.id);
    if (!dynamics) {
      throw new NotFoundException('No relationship analysis found. Import some chat data first.');
    }
    return dynamics;
  }

  @Get('couple/comparison')
  @ApiOperation({ summary: 'Get side-by-side personality comparison' })
  @ApiResponse({ status: 200, description: 'Comparison retrieved' })
  async getCoupleComparison(@Request() req: any) {
    const couple = await this.getUserCouple(req.user.id);

    if (!couple) {
      throw new NotFoundException('You are not part of a couple yet.');
    }

    const partner1Id = couple.partner1Id;
    const partner2Id = couple.partner2Id;

    if (!partner1Id || !partner2Id) {
      throw new NotFoundException('Both partners need to be registered.');
    }

    const [profile1, profile2, dynamics, partner1, partner2] = await Promise.all([
      this.profileAggregator.getPersonalityProfile(partner1Id),
      this.profileAggregator.getPersonalityProfile(partner2Id),
      this.profileAggregator.getRelationshipDynamic(couple.id),
      this.prisma.user.findUnique({ where: { id: partner1Id } }),
      this.prisma.user.findUnique({ where: { id: partner2Id } }),
    ]);

    return {
      partner1: {
        userId: partner1Id,
        name: partner1?.name || 'Partner 1',
        profile: profile1,
      },
      partner2: {
        userId: partner2Id,
        name: partner2?.name || 'Partner 2',
        profile: profile2,
      },
      dynamics,
      insights: this.generateComparisonInsights(profile1, profile2, dynamics),
    };
  }

  @Post('analyze/:sessionId')
  @ApiOperation({ summary: 'Analyze a session for personality insights' })
  @ApiParam({ name: 'sessionId', description: 'Session ID to analyze' })
  @ApiResponse({ status: 200, description: 'Session analyzed' })
  async analyzeSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    // Get session with couple info
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        couple: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Verify user is in session's couple
    const userCouple = await this.getUserCouple(req.user.id);

    if (!userCouple || userCouple.id !== session.coupleId) {
      throw new NotFoundException('Session not found');
    }

    // Parse transcript into messages
    const messages = this.parseTranscriptToMessages(
      session.transcript,
      session.chatParticipants,
    );

    if (messages.length === 0) {
      throw new NotFoundException('No messages found in session to analyze.');
    }

    // Create participant to user mapping if we have 2 participants
    const participantToUserMap = new Map<string, string>();
    if (session.chatParticipants.length >= 2 && session.couple?.partner1Id) {
      participantToUserMap.set(session.chatParticipants[0], session.couple.partner1Id);
      if (session.couple.partner2Id) {
        participantToUserMap.set(session.chatParticipants[1], session.couple.partner2Id);
      }
    }

    // Analyze session
    const result = await this.profileAggregator.processSession(
      sessionId,
      session.coupleId,
      messages,
      participantToUserMap,
    );

    return {
      sessionId,
      profiles: Object.fromEntries(result.profiles),
      dynamics: result.dynamics,
      participantMapping: Object.fromEntries(participantToUserMap),
      messagesAnalyzed: messages.length,
    };
  }

  /**
   * Get the couple for a user
   */
  private async getUserCouple(userId: string) {
    // Check if user is partner1 in any couple
    let couple = await this.prisma.couple.findFirst({
      where: { partner1Id: userId },
    });

    // If not, check if user is partner2
    if (!couple) {
      couple = await this.prisma.couple.findFirst({
        where: { partner2Id: userId },
      });
    }

    return couple;
  }

  /**
   * Parse transcript text into structured messages
   * Handles WhatsApp export format and other text formats
   */
  private parseTranscriptToMessages(
    transcript: string | null,
    participants: string[],
  ): Array<{ sender: string; content: string }> {
    if (!transcript) return [];

    const messages: Array<{ sender: string; content: string }> = [];

    // WhatsApp format: [DD/MM/YYYY, HH:MM:SS] Name: Message
    // or: DD/MM/YYYY, HH:MM - Name: Message
    const whatsappRegex =
      /(?:\[?\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-]?\s*)([^:]+):\s*(.+)/g;

    let match;
    while ((match = whatsappRegex.exec(transcript)) !== null) {
      const sender = match[1].trim();
      const content = match[2].trim();

      // Skip system messages
      if (content.includes('Messages and calls are end-to-end encrypted')) continue;
      if (content.includes('created group')) continue;
      if (content.includes('added') && content.includes('to the group')) continue;
      if (content === '<Media omitted>') continue;

      messages.push({ sender, content });
    }

    // If no WhatsApp format matches, try simple "Name: Message" format
    if (messages.length === 0) {
      const lines = transcript.split('\n');
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0 && colonIndex < 50) {
          const sender = line.substring(0, colonIndex).trim();
          const content = line.substring(colonIndex + 1).trim();
          if (sender && content && participants.some((p) => sender.includes(p))) {
            messages.push({ sender, content });
          }
        }
      }
    }

    return messages;
  }

  private generateComparisonInsights(
    profile1: any,
    profile2: any,
    dynamics: any,
  ): string[] {
    const insights: string[] = [];

    if (!profile1 || !profile2) {
      return ['Not enough data to generate comparison insights.'];
    }

    // Attachment compatibility
    if (profile1.attachmentStyle && profile2.attachmentStyle) {
      if (profile1.attachmentStyle === 'SECURE' && profile2.attachmentStyle === 'SECURE') {
        insights.push(
          'Both partners show secure attachment patterns, which is a strong foundation for intimacy.',
        );
      } else if (
        (profile1.attachmentStyle === 'ANXIOUS_PREOCCUPIED' &&
          profile2.attachmentStyle === 'DISMISSIVE_AVOIDANT') ||
        (profile1.attachmentStyle === 'DISMISSIVE_AVOIDANT' &&
          profile2.attachmentStyle === 'ANXIOUS_PREOCCUPIED')
      ) {
        insights.push(
          'This pairing shows a classic anxious-avoidant dynamic. Understanding this pattern can help break cycles.',
        );
      }
    }

    // Big Five differences
    if (profile1.openness && profile2.openness) {
      const opennessDiff = Math.abs(profile1.openness - profile2.openness);
      if (opennessDiff > 30) {
        insights.push(
          'Partners have different levels of openness to new experiences. This can create both tension and growth opportunities.',
        );
      }
    }

    if (profile1.extraversion && profile2.extraversion) {
      const extraversionDiff = Math.abs(profile1.extraversion - profile2.extraversion);
      if (extraversionDiff > 30) {
        insights.push(
          'Different energy levels (introvert/extrovert balance) may require compromise on social activities.',
        );
      }
    }

    // Dynamics insights
    if (dynamics) {
      if (dynamics.positiveToNegativeRatio && dynamics.positiveToNegativeRatio >= 5) {
        insights.push(
          'Your positive-to-negative interaction ratio is healthy (5:1 is the Gottman research target).',
        );
      } else if (dynamics.positiveToNegativeRatio && dynamics.positiveToNegativeRatio < 3) {
        insights.push(
          'Consider increasing positive interactions. Research suggests 5:1 positive-to-negative is optimal.',
        );
      }

      if (dynamics.pursuerWithdrawer) {
        insights.push(
          'A pursuer-withdrawer pattern was detected. Breaking this cycle can improve connection.',
        );
      }
    }

    if (insights.length === 0) {
      insights.push(
        'Continue building your profiles by importing more conversations for deeper insights.',
      );
    }

    return insights;
  }
}
