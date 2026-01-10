import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ShareEventType, ShareMethod } from '@prisma/client';

/**
 * Service for tracking share link events (analytics)
 */
@Injectable()
export class ShareEventsService {
  private readonly logger = new Logger(ShareEventsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track share link creation
   */
  async trackLinkCreated(params: {
    sessionId?: string;
    profileId?: string;
    method?: ShareMethod;
    expiryDays: number;
    anonymized: boolean;
  }) {
    await this.prisma.shareEvent.create({
      data: {
        sessionId: params.sessionId,
        profileId: params.profileId,
        eventType: ShareEventType.LINK_CREATED,
        method: params.method,
        metadata: {
          expiryDays: params.expiryDays,
          anonymized: params.anonymized,
        },
      },
    });

    this.logger.log(
      `Share link created: ${params.sessionId ? 'session' : 'profile'} ${params.sessionId || params.profileId}`,
    );
  }

  /**
   * Track share link view (public access)
   */
  async trackLinkViewed(params: {
    sessionId?: string;
    profileId?: string;
    userAgent?: string;
    referer?: string;
  }) {
    await this.prisma.shareEvent.create({
      data: {
        sessionId: params.sessionId,
        profileId: params.profileId,
        eventType: ShareEventType.LINK_VIEWED,
        metadata: {
          userAgent: params.userAgent,
          referer: params.referer,
        },
      },
    });

    this.logger.debug(
      `Share link viewed: ${params.sessionId ? 'session' : 'profile'} ${params.sessionId || params.profileId}`,
    );
  }

  /**
   * Track share link revocation
   */
  async trackLinkRevoked(params: {
    sessionId?: string;
    profileId?: string;
  }) {
    await this.prisma.shareEvent.create({
      data: {
        sessionId: params.sessionId,
        profileId: params.profileId,
        eventType: ShareEventType.LINK_REVOKED,
        metadata: {},
      },
    });

    this.logger.log(
      `Share link revoked: ${params.sessionId ? 'session' : 'profile'} ${params.sessionId || params.profileId}`,
    );
  }

  /**
   * Track expired share link (automatic cleanup)
   */
  async trackLinkExpired(params: {
    sessionId?: string;
    profileId?: string;
  }) {
    await this.prisma.shareEvent.create({
      data: {
        sessionId: params.sessionId,
        profileId: params.profileId,
        eventType: ShareEventType.LINK_EXPIRED,
        metadata: {},
      },
    });

    this.logger.debug(
      `Share link expired: ${params.sessionId ? 'session' : 'profile'} ${params.sessionId || params.profileId}`,
    );
  }

  /**
   * Get share events for a session
   */
  async getEventsForSession(sessionId: string) {
    return this.prisma.shareEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get share events for a profile
   */
  async getEventsForProfile(profileId: string) {
    return this.prisma.shareEvent.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
