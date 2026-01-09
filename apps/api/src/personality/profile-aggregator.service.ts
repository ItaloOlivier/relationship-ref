import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LinguisticAnalysisService, LinguisticFeatures } from './linguistic-analysis.service';
import { AttachmentAnalyzerService, AttachmentAnalysis, CommunicationAnalysis, ConflictStyleAnalysis } from './attachment-analyzer.service';
import { BigFiveAnalyzerService, BigFiveScores, EmotionalIntelligenceScores, PersonalityNarratives } from './big-five-analyzer.service';
import { RelationshipDynamicsService, ParticipantFeatures, RelationshipDynamicsAnalysis } from './relationship-dynamics.service';
import { AttachmentStyle, CommunicationStyle } from '@prisma/client';

/**
 * Full personality profile aggregated from all analyzers
 */
export interface FullPersonalityProfile {
  // Big Five traits
  bigFive: BigFiveScores;

  // Attachment
  attachment: AttachmentAnalysis;

  // Communication style
  communication: CommunicationAnalysis;

  // Conflict style
  conflict: ConflictStyleAnalysis;

  // Emotional intelligence
  emotionalIntelligence: EmotionalIntelligenceScores;

  // Narratives
  narratives: PersonalityNarratives;

  // Metadata
  sessionsAnalyzed: number;
  confidence: number;
  lastUpdated: Date;
}

/**
 * Service that aggregates all personality analysis and persists profiles
 */
@Injectable()
export class ProfileAggregatorService {
  constructor(
    private prisma: PrismaService,
    private linguisticService: LinguisticAnalysisService,
    private attachmentService: AttachmentAnalyzerService,
    private bigFiveService: BigFiveAnalyzerService,
    private relationshipService: RelationshipDynamicsService,
  ) {}

  /**
   * Process a session and update personality profiles for all participants
   */
  async processSession(
    sessionId: string,
    coupleId: string,
    messages: Array<{ sender: string; content: string }>,
    participantToUserMap?: Map<string, string>, // Map participant names to user IDs
  ): Promise<{
    profiles: Map<string, FullPersonalityProfile>;
    dynamics: RelationshipDynamicsAnalysis | null;
  }> {
    // Extract features per participant
    const featuresMap = this.linguisticService.extractFeaturesFromConversation(messages);
    const profiles = new Map<string, FullPersonalityProfile>();
    const participantFeatures: ParticipantFeatures[] = [];

    // Group messages by sender for counts
    const messageCounts = new Map<string, number>();
    for (const msg of messages) {
      messageCounts.set(msg.sender, (messageCounts.get(msg.sender) || 0) + 1);
    }

    // Analyze each participant
    for (const [participantName, features] of featuresMap) {
      // Get Four Horsemen and repair attempts for this participant
      const participantMessages = messages
        .filter((m) => m.sender === participantName)
        .map((m) => m.content)
        .join(' ');

      const horsemen = this.linguisticService.detectFourHorsemen(participantMessages);
      const repairAttempts = this.linguisticService.detectRepairAttempts(participantMessages);

      // Build full profile
      const profile = await this.buildFullProfile(features, horsemen, repairAttempts);
      profiles.set(participantName, profile);

      // Store for relationship dynamics
      const userId = participantToUserMap?.get(participantName);
      participantFeatures.push({
        participantName,
        userId,
        features,
        horsemen,
        repairAttempts,
        messageCount: messageCounts.get(participantName) || 0,
        wordCount: features.totalWords,
      });

      // Save linguistic snapshot
      if (userId) {
        await this.saveLinguisticSnapshot(
          sessionId,
          userId,
          participantName,
          features,
          horsemen,
          repairAttempts,
        );

        // Update personality profile
        await this.updatePersonalityProfile(userId, profile);
      }
    }

    // Analyze couple dynamics if we have exactly 2 participants
    let dynamics: RelationshipDynamicsAnalysis | null = null;
    if (participantFeatures.length === 2) {
      dynamics = this.relationshipService.analyzeRelationshipDynamics(
        participantFeatures[0],
        participantFeatures[1],
      );

      // Update relationship dynamic record
      await this.updateRelationshipDynamic(
        coupleId,
        dynamics,
        participantFeatures[0].participantName,
        participantFeatures[1].participantName,
      );
    }

    return { profiles, dynamics };
  }

  /**
   * Build a full personality profile from linguistic features
   */
  private async buildFullProfile(
    features: LinguisticFeatures,
    horsemen: { criticism: number; contempt: number; defensiveness: number; stonewalling: number },
    repairAttempts: number,
  ): Promise<FullPersonalityProfile> {
    // Big Five
    const bigFive = this.bigFiveService.analyzeBigFive(features);

    // Attachment
    const attachment = this.attachmentService.analyzeAttachment(
      features,
      horsemen,
      repairAttempts,
    );

    // Communication style
    const communication = this.attachmentService.analyzeCommunicationStyle(
      features,
      horsemen,
      repairAttempts,
    );

    // Conflict style
    const conflict = this.attachmentService.analyzeConflictStyle(
      features,
      horsemen,
      repairAttempts,
    );

    // Emotional intelligence
    const emotionalIntelligence = this.bigFiveService.analyzeEmotionalIntelligence(
      features,
      horsemen,
      repairAttempts,
    );

    // Generate narratives
    const narratives = await this.bigFiveService.generateNarratives(
      bigFive,
      attachment,
      communication,
      conflict,
      emotionalIntelligence,
    );

    // Calculate overall confidence
    const confidence = Math.round(
      (bigFive.confidence +
        attachment.confidence +
        communication.confidence +
        conflict.confidence +
        emotionalIntelligence.confidence) /
        5,
    );

    return {
      bigFive,
      attachment,
      communication,
      conflict,
      emotionalIntelligence,
      narratives,
      sessionsAnalyzed: 1,
      confidence,
      lastUpdated: new Date(),
    };
  }

  /**
   * Save linguistic snapshot to database
   */
  private async saveLinguisticSnapshot(
    sessionId: string,
    userId: string,
    participantName: string,
    features: LinguisticFeatures,
    horsemen: { criticism: number; contempt: number; defensiveness: number; stonewalling: number },
    repairAttempts: number,
  ): Promise<void> {
    // Get or create personality profile
    let profile = await this.prisma.personalityProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.personalityProfile.create({
        data: { userId },
      });
    }

    const snapshotData = {
      totalWords: features.totalWords,
      uniqueWords: features.uniqueWords,
      avgWordLength: features.avgWordLength,
      avgSentenceLength: features.avgSentenceLength,
      firstPersonSingular: features.firstPersonSingular,
      firstPersonPlural: features.firstPersonPlural,
      secondPerson: features.secondPerson,
      thirdPerson: features.thirdPerson,
      positiveEmotionWords: features.positiveEmotionWords,
      negativeEmotionWords: features.negativeEmotionWords,
      anxietyWords: features.anxietyWords,
      angerWords: features.angerWords,
      sadnessWords: features.sadnessWords,
      certaintyWords: features.certaintyWords,
      tentativeWords: features.tentativeWords,
      discrepancyWords: features.discrepancyWords,
      affiliationWords: features.affiliationWords,
      achievementWords: features.achievementWords,
      powerWords: features.powerWords,
      questionFrequency: features.questionFrequency,
      exclamationFrequency: features.exclamationFrequency,
      hedgingPhrases: features.hedgingPhrases,
      criticismCount: horsemen.criticism,
      contemptCount: horsemen.contempt,
      defensivenessCount: horsemen.defensiveness,
      stonewallingCount: horsemen.stonewalling,
      repairAttemptCount: repairAttempts,
      featureVector: features as object,
    };

    // Create linguistic snapshot
    await this.prisma.linguisticSnapshot.upsert({
      where: {
        sessionId_participantName: { sessionId, participantName },
      },
      update: snapshotData,
      create: {
        profileId: profile.id,
        sessionId,
        participantName,
        ...snapshotData,
      },
    });
  }

  /**
   * Update personality profile with new session data
   * Uses weighted average to blend new data with existing profile
   */
  private async updatePersonalityProfile(
    userId: string,
    newProfile: FullPersonalityProfile,
  ): Promise<void> {
    const existing = await this.prisma.personalityProfile.findUnique({
      where: { userId },
    });

    if (!existing || existing.sessionsAnalyzed === 0) {
      // First session - use new profile directly
      await this.prisma.personalityProfile.upsert({
        where: { userId },
        update: this.mapProfileToDatabase(newProfile, 1),
        create: {
          userId,
          ...this.mapProfileToDatabase(newProfile, 1),
        },
      });
    } else {
      // Blend with existing profile using weighted average
      // More recent sessions have slightly more weight
      const totalSessions = existing.sessionsAnalyzed + 1;
      const existingWeight = existing.sessionsAnalyzed / totalSessions;
      const newWeight = 1.2 / totalSessions; // Slightly higher weight for new data

      const blended = this.blendProfiles(
        existing,
        newProfile,
        existingWeight,
        newWeight,
      );

      await this.prisma.personalityProfile.update({
        where: { userId },
        data: this.mapProfileToDatabase(blended, totalSessions),
      });
    }
  }

  /**
   * Blend existing profile with new profile using weighted average
   */
  private blendProfiles(
    existing: any,
    newProfile: FullPersonalityProfile,
    existingWeight: number,
    newWeight: number,
  ): Partial<FullPersonalityProfile> {
    const blend = (oldVal: number | null, newVal: number): number => {
      if (oldVal === null) return newVal;
      return Math.round(oldVal * existingWeight + newVal * newWeight);
    };

    return {
      bigFive: {
        openness: blend(existing.openness, newProfile.bigFive.openness),
        conscientiousness: blend(existing.conscientiousness, newProfile.bigFive.conscientiousness),
        extraversion: blend(existing.extraversion, newProfile.bigFive.extraversion),
        agreeableness: blend(existing.agreeableness, newProfile.bigFive.agreeableness),
        neuroticism: blend(existing.neuroticism, newProfile.bigFive.neuroticism),
        confidence: blend(existing.confidenceScore, newProfile.bigFive.confidence),
      },
      attachment: {
        ...newProfile.attachment,
        anxietyScore: blend(existing.attachmentAnxiety, newProfile.attachment.anxietyScore),
        avoidanceScore: blend(existing.attachmentAvoidance, newProfile.attachment.avoidanceScore),
      },
      emotionalIntelligence: {
        emotionalAwareness: blend(
          existing.emotionalAwareness,
          newProfile.emotionalIntelligence.emotionalAwareness,
        ),
        empathyScore: blend(existing.empathyScore, newProfile.emotionalIntelligence.empathyScore),
        emotionalRegulation: blend(
          existing.emotionalRegulation,
          newProfile.emotionalIntelligence.emotionalRegulation,
        ),
        confidence: newProfile.emotionalIntelligence.confidence,
      },
      narratives: newProfile.narratives, // Always use latest narratives
    };
  }

  /**
   * Map profile to database fields
   */
  private mapProfileToDatabase(
    profile: FullPersonalityProfile | Partial<FullPersonalityProfile>,
    sessionsAnalyzed: number,
  ): any {
    const bigFive = profile.bigFive || {};
    const attachment = profile.attachment || {};
    const communication = profile.communication || {};
    const eq = profile.emotionalIntelligence || {};
    const narratives = profile.narratives || {};

    return {
      openness: (bigFive as any).openness,
      conscientiousness: (bigFive as any).conscientiousness,
      extraversion: (bigFive as any).extraversion,
      agreeableness: (bigFive as any).agreeableness,
      neuroticism: (bigFive as any).neuroticism,
      attachmentStyle: (attachment as any).style || AttachmentStyle.UNDETERMINED,
      attachmentAnxiety: (attachment as any).anxietyScore,
      attachmentAvoidance: (attachment as any).avoidanceScore,
      communicationStyle: (communication as any).style || CommunicationStyle.MIXED,
      conflictStyle: (profile as any).conflict?.style,
      emotionalAwareness: (eq as any).emotionalAwareness,
      empathyScore: (eq as any).empathyScore,
      emotionalRegulation: (eq as any).emotionalRegulation,
      repairInitiation: (profile as any).conflict?.assertivenessScore,
      repairReceptivity: (profile as any).conflict?.cooperativenessScore,
      confidenceScore: (bigFive as any).confidence || 0,
      sessionsAnalyzed,
      strengthsNarrative: (narratives as any).strengthsNarrative,
      growthAreasNarrative: (narratives as any).growthAreasNarrative,
      communicationNarrative: (narratives as any).communicationNarrative,
    };
  }

  /**
   * Update relationship dynamic for couple
   */
  private async updateRelationshipDynamic(
    coupleId: string,
    dynamics: RelationshipDynamicsAnalysis,
    participant1Name: string,
    participant2Name: string,
  ): Promise<void> {
    const existing = await this.prisma.relationshipDynamic.findUnique({
      where: { coupleId },
    });

    // Generate narratives
    const narratives = await this.relationshipService.generateCoupleNarrative(
      dynamics,
      participant1Name,
      participant2Name,
    );

    const data = {
      pursuerWithdrawer: dynamics.pursuerWithdrawer.isPursuerWithdrawer,
      pursuerId: dynamics.pursuerWithdrawer.pursuerId,
      conversationDominance: dynamics.dominance,
      topicInitiation: dynamics.topicInitiation,
      emotionalReciprocity: dynamics.emotionalReciprocity,
      validationBalance: dynamics.validationBalance,
      supportBalance: dynamics.supportBalance,
      escalationTendency: dynamics.escalationTendency,
      deescalationSkill: dynamics.deescalationSkill,
      resolutionRate: dynamics.resolutionRate,
      positiveToNegativeRatio: dynamics.positiveToNegativeRatio,
      relationshipStrengths: dynamics.relationshipStrengths,
      growthOpportunities: dynamics.growthOpportunities,
      dynamicNarrative: narratives.dynamicNarrative,
      coachingFocus: narratives.coachingFocus,
      confidenceScore: dynamics.confidence,
      sessionsAnalyzed: existing ? existing.sessionsAnalyzed + 1 : 1,
    };

    await this.prisma.relationshipDynamic.upsert({
      where: { coupleId },
      update: data,
      create: { coupleId, ...data },
    });
  }

  /**
   * Get personality profile for a user
   */
  async getPersonalityProfile(userId: string): Promise<any | null> {
    const profile = await this.prisma.personalityProfile.findUnique({
      where: { userId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) return null;

    // Add human-readable descriptions
    return {
      ...profile,
      attachmentDescription: this.attachmentService.getAttachmentDescription(
        profile.attachmentStyle,
      ),
      communicationDescription: this.attachmentService.getCommunicationDescription(
        profile.communicationStyle,
      ),
      traitDescriptions: {
        openness: profile.openness
          ? this.bigFiveService.getTraitDescription('openness', profile.openness)
          : null,
        conscientiousness: profile.conscientiousness
          ? this.bigFiveService.getTraitDescription(
              'conscientiousness',
              profile.conscientiousness,
            )
          : null,
        extraversion: profile.extraversion
          ? this.bigFiveService.getTraitDescription('extraversion', profile.extraversion)
          : null,
        agreeableness: profile.agreeableness
          ? this.bigFiveService.getTraitDescription('agreeableness', profile.agreeableness)
          : null,
        neuroticism: profile.neuroticism
          ? this.bigFiveService.getTraitDescription('neuroticism', profile.neuroticism)
          : null,
      },
    };
  }

  /**
   * Get relationship dynamic for a couple
   */
  async getRelationshipDynamic(coupleId: string): Promise<any | null> {
    const dynamic = await this.prisma.relationshipDynamic.findUnique({
      where: { coupleId },
    });

    if (!dynamic) return null;

    // Add human-readable descriptions for strengths and growth areas
    return {
      ...dynamic,
      strengthDescriptions: dynamic.relationshipStrengths.map((s: string) =>
        this.relationshipService.getStrengthDescription(s),
      ),
      growthDescriptions: dynamic.growthOpportunities.map((g: string) =>
        this.relationshipService.getGrowthDescription(g),
      ),
    };
  }

  /**
   * Get profile evolution over time for a user
   */
  async getProfileEvolution(
    userId: string,
  ): Promise<{ date: Date; confidence: number; traits: any }[]> {
    const profile = await this.prisma.personalityProfile.findUnique({
      where: { userId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!profile || profile.snapshots.length === 0) return [];

    // Calculate running averages at each snapshot
    const evolution: { date: Date; confidence: number; traits: any }[] = [];
    let runningSum = {
      positiveEmotion: 0,
      negativeEmotion: 0,
      firstPersonSingular: 0,
      firstPersonPlural: 0,
      certainty: 0,
      tentative: 0,
    };
    let count = 0;

    for (const snapshot of profile.snapshots) {
      count++;
      runningSum.positiveEmotion += snapshot.positiveEmotionWords;
      runningSum.negativeEmotion += snapshot.negativeEmotionWords;
      runningSum.firstPersonSingular += snapshot.firstPersonSingular;
      runningSum.firstPersonPlural += snapshot.firstPersonPlural;
      runningSum.certainty += snapshot.certaintyWords;
      runningSum.tentative += snapshot.tentativeWords;

      evolution.push({
        date: snapshot.createdAt,
        confidence: this.calculateConfidence(count),
        traits: {
          emotionBalance:
            (runningSum.positiveEmotion / count) /
            Math.max((runningSum.negativeEmotion / count), 0.1),
          selfFocus: runningSum.firstPersonSingular / count,
          partnershipFocus: runningSum.firstPersonPlural / count,
          certaintyLevel: runningSum.certainty / count,
          openness: runningSum.tentative / count,
        },
      });
    }

    return evolution;
  }

  private calculateConfidence(sessionsCount: number): number {
    if (sessionsCount < 2) return 20;
    if (sessionsCount < 5) return 40;
    if (sessionsCount < 10) return 60;
    if (sessionsCount < 20) return 80;
    return 90;
  }
}
