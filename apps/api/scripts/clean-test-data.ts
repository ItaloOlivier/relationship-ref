import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Delete in correct order to respect foreign key constraints

    console.log('Deleting ShareEvents...');
    const shareEvents = await prisma.shareEvent.deleteMany({});
    console.log(`✓ Deleted ${shareEvents.count} share events`);

    console.log('Deleting SessionQuestions...');
    const sessionQuestions = await prisma.sessionQuestion.deleteMany({});
    console.log(`✓ Deleted ${sessionQuestions.count} session questions`);

    console.log('Deleting PatternMetricsCache...');
    const patternMetrics = await prisma.patternMetricsCache.deleteMany({});
    console.log(`✓ Deleted ${patternMetrics.count} pattern metrics`);

    console.log('Deleting PatternInsights...');
    const patternInsights = await prisma.patternInsight.deleteMany({});
    console.log(`✓ Deleted ${patternInsights.count} pattern insights`);

    console.log('Deleting WeeklyReports...');
    const weeklyReports = await prisma.weeklyReport.deleteMany({});
    console.log(`✓ Deleted ${weeklyReports.count} weekly reports`);

    console.log('Deleting Streaks...');
    const streaks = await prisma.streak.deleteMany({});
    console.log(`✓ Deleted ${streaks.count} streaks`);

    console.log('Deleting Quest progress...');
    const questProgress = await prisma.questProgress.deleteMany({});
    console.log(`✓ Deleted ${questProgress.count} quest progress records`);

    console.log('Deleting Quests...');
    const quests = await prisma.quest.deleteMany({});
    console.log(`✓ Deleted ${quests.count} quests`);

    console.log('Deleting PersonalityProfiles...');
    const personalityProfiles = await prisma.personalityProfile.deleteMany({});
    console.log(`✓ Deleted ${personalityProfiles.count} personality profiles`);

    console.log('Deleting LinguisticSnapshots...');
    const linguisticSnapshots = await prisma.linguisticSnapshot.deleteMany({});
    console.log(`✓ Deleted ${linguisticSnapshots.count} linguistic snapshots`);

    console.log('Deleting RelationshipDynamics...');
    const relationshipDynamics = await prisma.relationshipDynamic.deleteMany({});
    console.log(`✓ Deleted ${relationshipDynamics.count} relationship dynamics`);

    console.log('Deleting AnalysisResults...');
    const analysisResults = await prisma.analysisResult.deleteMany({});
    console.log(`✓ Deleted ${analysisResults.count} analysis results`);

    console.log('Deleting Sessions...');
    const sessions = await prisma.session.deleteMany({});
    console.log(`✓ Deleted ${sessions.count} sessions`);

    console.log('Deleting RelationshipMembers...');
    const relationshipMembers = await prisma.relationshipMember.deleteMany({});
    console.log(`✓ Deleted ${relationshipMembers.count} relationship members`);

    console.log('Deleting RelationshipLifecycleEvents...');
    const lifecycleEvents = await prisma.relationshipLifecycleEvent.deleteMany({});
    console.log(`✓ Deleted ${lifecycleEvents.count} lifecycle events`);

    console.log('Deleting Relationships...');
    const relationships = await prisma.relationship.deleteMany({});
    console.log(`✓ Deleted ${relationships.count} relationships`);

    console.log('Deleting Couples...');
    const couples = await prisma.couple.deleteMany({});
    console.log(`✓ Deleted ${couples.count} couples`);

    console.log('Deleting EmotionalBankEntries...');
    const emotionalBankEntries = await prisma.emotionalBankEntry.deleteMany({});
    console.log(`✓ Deleted ${emotionalBankEntries.count} emotional bank entries`);

    console.log('Deleting EmotionalBankLedgers...');
    const emotionalBankLedgers = await prisma.emotionalBankLedger.deleteMany({});
    console.log(`✓ Deleted ${emotionalBankLedgers.count} emotional bank ledgers`);

    console.log('Deleting Users...');
    const users = await prisma.user.deleteMany({});
    console.log(`✓ Deleted ${users.count} users`);

    console.log('\n✅ Database cleanup complete!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.count}`);
    console.log(`   Couples: ${couples.count}`);
    console.log(`   Relationships: ${relationships.count}`);
    console.log(`   Sessions: ${sessions.count}`);
    console.log(`   Analysis Results: ${analysisResults.count}`);
    console.log(`   Personality Profiles: ${personalityProfiles.count}`);
    console.log(`   Total records deleted: ${
      shareEvents.count +
      sessionQuestions.count +
      patternMetrics.count +
      patternInsights.count +
      weeklyReports.count +
      streaks.count +
      questProgress.count +
      quests.count +
      personalityProfiles.count +
      linguisticSnapshots.count +
      relationshipDynamics.count +
      analysisResults.count +
      sessions.count +
      relationshipMembers.count +
      lifecycleEvents.count +
      relationships.count +
      couples.count +
      emotionalBankEntries.count +
      emotionalBankLedgers.count +
      users.count
    }`);

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanTestData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
