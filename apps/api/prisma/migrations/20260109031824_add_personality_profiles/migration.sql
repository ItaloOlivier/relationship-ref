-- CreateEnum
CREATE TYPE "AttachmentStyle" AS ENUM ('SECURE', 'ANXIOUS_PREOCCUPIED', 'DISMISSIVE_AVOIDANT', 'FEARFUL_AVOIDANT', 'UNDETERMINED');

-- CreateEnum
CREATE TYPE "CommunicationStyle" AS ENUM ('PLACATER', 'BLAMER', 'COMPUTER', 'DISTRACTER', 'LEVELER', 'MIXED');

-- CreateTable
CREATE TABLE "personality_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openness" DOUBLE PRECISION,
    "conscientiousness" DOUBLE PRECISION,
    "extraversion" DOUBLE PRECISION,
    "agreeableness" DOUBLE PRECISION,
    "neuroticism" DOUBLE PRECISION,
    "attachmentStyle" "AttachmentStyle" NOT NULL DEFAULT 'UNDETERMINED',
    "attachmentAnxiety" DOUBLE PRECISION,
    "attachmentAvoidance" DOUBLE PRECISION,
    "communicationStyle" "CommunicationStyle" NOT NULL DEFAULT 'MIXED',
    "emotionalAwareness" DOUBLE PRECISION,
    "empathyScore" DOUBLE PRECISION,
    "emotionalRegulation" DOUBLE PRECISION,
    "conflictStyle" TEXT,
    "repairInitiation" DOUBLE PRECISION,
    "repairReceptivity" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionsAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "strengthsNarrative" TEXT,
    "growthAreasNarrative" TEXT,
    "communicationNarrative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personality_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linguistic_snapshots" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "uniqueWords" INTEGER NOT NULL,
    "avgWordLength" DOUBLE PRECISION NOT NULL,
    "avgSentenceLength" DOUBLE PRECISION NOT NULL,
    "firstPersonSingular" DOUBLE PRECISION NOT NULL,
    "firstPersonPlural" DOUBLE PRECISION NOT NULL,
    "secondPerson" DOUBLE PRECISION NOT NULL,
    "thirdPerson" DOUBLE PRECISION NOT NULL,
    "positiveEmotionWords" DOUBLE PRECISION NOT NULL,
    "negativeEmotionWords" DOUBLE PRECISION NOT NULL,
    "anxietyWords" DOUBLE PRECISION NOT NULL,
    "angerWords" DOUBLE PRECISION NOT NULL,
    "sadnessWords" DOUBLE PRECISION NOT NULL,
    "certaintyWords" DOUBLE PRECISION NOT NULL,
    "tentativeWords" DOUBLE PRECISION NOT NULL,
    "discrepancyWords" DOUBLE PRECISION NOT NULL,
    "affiliationWords" DOUBLE PRECISION NOT NULL,
    "achievementWords" DOUBLE PRECISION NOT NULL,
    "powerWords" DOUBLE PRECISION NOT NULL,
    "questionFrequency" DOUBLE PRECISION NOT NULL,
    "exclamationFrequency" DOUBLE PRECISION NOT NULL,
    "hedgingPhrases" DOUBLE PRECISION NOT NULL,
    "criticismCount" INTEGER NOT NULL DEFAULT 0,
    "contemptCount" INTEGER NOT NULL DEFAULT 0,
    "defensivenessCount" INTEGER NOT NULL DEFAULT 0,
    "stonewallingCount" INTEGER NOT NULL DEFAULT 0,
    "repairAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "repairSuccessRate" DOUBLE PRECISION,
    "featureVector" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linguistic_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_dynamics" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "pursuerWithdrawer" BOOLEAN,
    "pursuerId" TEXT,
    "conversationDominance" JSONB,
    "interruptionPattern" JSONB,
    "topicInitiation" JSONB,
    "emotionalReciprocity" DOUBLE PRECISION,
    "validationBalance" DOUBLE PRECISION,
    "supportBalance" DOUBLE PRECISION,
    "escalationTendency" DOUBLE PRECISION,
    "deescalationSkill" DOUBLE PRECISION,
    "resolutionRate" DOUBLE PRECISION,
    "positiveToNegativeRatio" DOUBLE PRECISION,
    "relationshipStrengths" TEXT[],
    "growthOpportunities" TEXT[],
    "dynamicNarrative" TEXT,
    "coachingFocus" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionsAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_dynamics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personality_profiles_userId_key" ON "personality_profiles"("userId");

-- CreateIndex
CREATE INDEX "linguistic_snapshots_profileId_idx" ON "linguistic_snapshots"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "linguistic_snapshots_sessionId_participantName_key" ON "linguistic_snapshots"("sessionId", "participantName");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_dynamics_coupleId_key" ON "relationship_dynamics"("coupleId");

-- AddForeignKey
ALTER TABLE "personality_profiles" ADD CONSTRAINT "personality_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linguistic_snapshots" ADD CONSTRAINT "linguistic_snapshots_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personality_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linguistic_snapshots" ADD CONSTRAINT "linguistic_snapshots_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_dynamics" ADD CONSTRAINT "relationship_dynamics_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;
