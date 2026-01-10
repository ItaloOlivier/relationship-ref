-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('TOPIC_TRIGGER', 'TIME_PATTERN', 'BEHAVIOR_TREND', 'HORSEMAN_TREND', 'COMMUNICATION_STYLE', 'POSITIVE_PATTERN');

-- CreateTable: SessionQuestion (Q&A for individual sessions)
CREATE TABLE "session_questions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "referencedQuotes" JSONB,
    "referencedCards" JSONB,
    "processingTimeMs" INTEGER,
    "tokensUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PatternInsight (Cross-session pattern recognition)
CREATE TABLE "pattern_insights" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT,
    "relationshipId" TEXT,
    "userId" TEXT,
    "patternType" "PatternType" NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "impact" TEXT NOT NULL,
    "sessionsCount" INTEGER NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "firstOccurrence" TIMESTAMP(3),
    "lastOccurrence" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pattern_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PatternMetricsCache (Aggregated metrics for quick pattern retrieval)
CREATE TABLE "pattern_metrics_cache" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT,
    "relationshipId" TEXT,
    "topicFrequency" JSONB NOT NULL,
    "topicScores" JSONB NOT NULL,
    "hourlyDistribution" JSONB NOT NULL,
    "weekdayDistribution" JSONB NOT NULL,
    "monthlyScores" JSONB NOT NULL,
    "horsemenTrend" JSONB NOT NULL,
    "repairAttemptTrend" JSONB NOT NULL,
    "cardRatioTrend" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pattern_metrics_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: SessionQuestion indexes
CREATE INDEX "session_questions_sessionId_createdAt_idx" ON "session_questions"("sessionId", "createdAt");
CREATE INDEX "session_questions_userId_idx" ON "session_questions"("userId");

-- CreateIndex: PatternInsight indexes
CREATE INDEX "pattern_insights_coupleId_patternType_idx" ON "pattern_insights"("coupleId", "patternType");
CREATE INDEX "pattern_insights_relationshipId_patternType_idx" ON "pattern_insights"("relationshipId", "patternType");
CREATE INDEX "pattern_insights_userId_idx" ON "pattern_insights"("userId");

-- CreateIndex: PatternMetricsCache unique constraints
CREATE UNIQUE INDEX "pattern_metrics_cache_coupleId_key" ON "pattern_metrics_cache"("coupleId");
CREATE UNIQUE INDEX "pattern_metrics_cache_relationshipId_key" ON "pattern_metrics_cache"("relationshipId");

-- AddForeignKey: SessionQuestion -> Session
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SessionQuestion -> User
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PatternInsight -> Couple
ALTER TABLE "pattern_insights" ADD CONSTRAINT "pattern_insights_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PatternInsight -> Relationship
ALTER TABLE "pattern_insights" ADD CONSTRAINT "pattern_insights_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PatternInsight -> User
ALTER TABLE "pattern_insights" ADD CONSTRAINT "pattern_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PatternMetricsCache -> Couple
ALTER TABLE "pattern_metrics_cache" ADD CONSTRAINT "pattern_metrics_cache_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PatternMetricsCache -> Relationship
ALTER TABLE "pattern_metrics_cache" ADD CONSTRAINT "pattern_metrics_cache_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
