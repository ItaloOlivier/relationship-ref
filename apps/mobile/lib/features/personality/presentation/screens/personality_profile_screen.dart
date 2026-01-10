import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/personality_repository.dart';
import '../../domain/personality_profile_model.dart';
import '../widgets/trait_gauge_card.dart';
import '../widgets/attachment_style_card.dart';
import '../widgets/communication_style_card.dart';
import '../widgets/emotional_intelligence_card.dart';
import '../widgets/narrative_card.dart';

class PersonalityProfileScreen extends ConsumerWidget {
  const PersonalityProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Personality'),
          actions: [
            IconButton(
              icon: const Icon(Icons.compare_arrows),
              tooltip: 'Compare with Partner',
              onPressed: () => context.push('/settings/personality/comparison'),
            ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Traits'),
              Tab(text: 'Attachment'),
              Tab(text: 'Coaching'),
            ],
          ),
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(myPersonalityProfileProvider);
          },
          child: const TabBarView(
            children: [
              _OverviewTab(),
              _TraitsTab(),
              _AttachmentTab(),
              _CoachingTab(),
            ],
          ),
        ),
      ),
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myPersonalityProfileProvider);

    return profileAsync.when(
      data: (profile) {
        if (profile == null) {
          return _buildEmptyState(context);
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildConfidenceCard(context, profile),
              const SizedBox(height: 16),
              AttachmentStyleCard(
                style: profile.attachmentStyle,
                anxietyScore: profile.attachmentAnxiety,
                avoidanceScore: profile.attachmentAvoidance,
                description: profile.attachmentDescription,
              ),
              const SizedBox(height: 16),
              CommunicationStyleCard(
                style: profile.communicationStyle,
                description: profile.communicationDescription,
              ),
              const SizedBox(height: 16),
              EmotionalIntelligenceCard(
                eq: profile.emotionalIntelligence,
              ),
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }

  Widget _buildConfidenceCard(BuildContext context, PersonalityProfile profile) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.1),
              ),
              child: Center(
                child: Text(
                  '${profile.confidenceScore.toInt()}%',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Profile Confidence',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    'Based on ${profile.sessionsAnalyzed} session${profile.sessionsAnalyzed == 1 ? '' : 's'}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 4),
                  if (profile.sessionsAnalyzed < 5)
                    Text(
                      'Import more chats for better accuracy',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.warning,
                            fontStyle: FontStyle.italic,
                          ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TraitsTab extends ConsumerWidget {
  const _TraitsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myPersonalityProfileProvider);

    return profileAsync.when(
      data: (profile) {
        if (profile == null) {
          return _buildEmptyState(context);
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Big Five Personality Traits',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Text(
                'Based on OCEAN model (0-100 scale)',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 16),
              TraitGaugeCard(
                label: 'Openness',
                value: profile.openness,
                description: profile.traitDescriptions.openness ??
                    'Curiosity, creativity, and openness to experience',
                icon: Icons.lightbulb_outline,
              ),
              const SizedBox(height: 12),
              TraitGaugeCard(
                label: 'Conscientiousness',
                value: profile.conscientiousness,
                description: profile.traitDescriptions.conscientiousness ??
                    'Organization, dependability, and self-discipline',
                icon: Icons.checklist,
              ),
              const SizedBox(height: 12),
              TraitGaugeCard(
                label: 'Extraversion',
                value: profile.extraversion,
                description: profile.traitDescriptions.extraversion ??
                    'Sociability, assertiveness, and positive emotions',
                icon: Icons.groups,
              ),
              const SizedBox(height: 12),
              TraitGaugeCard(
                label: 'Agreeableness',
                value: profile.agreeableness,
                description: profile.traitDescriptions.agreeableness ??
                    'Cooperation, trust, and empathy',
                icon: Icons.handshake,
              ),
              const SizedBox(height: 12),
              TraitGaugeCard(
                label: 'Neuroticism',
                value: profile.neuroticism,
                description: profile.traitDescriptions.neuroticism ??
                    'Emotional sensitivity and stress response',
                icon: Icons.psychology,
                color: profile.neuroticism != null && profile.neuroticism! > 60
                    ? AppColors.yellowCard
                    : null,
              ),
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }
}

class _AttachmentTab extends ConsumerWidget {
  const _AttachmentTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myPersonalityProfileProvider);

    return profileAsync.when(
      data: (profile) {
        if (profile == null) {
          return _buildEmptyState(context);
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AttachmentStyleCard(
                style: profile.attachmentStyle,
                anxietyScore: profile.attachmentAnxiety,
                avoidanceScore: profile.attachmentAvoidance,
                description: profile.attachmentDescription,
              ),
              const SizedBox(height: 24),
              Text(
                'What This Means',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              _buildAttachmentExplanation(context, profile.attachmentStyle),
              const SizedBox(height: 24),
              Text(
                'Conflict Style',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              _buildConflictStyleCard(context, profile),
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }

  Widget _buildAttachmentExplanation(
      BuildContext context, AttachmentStyle style) {
    String explanation;
    String tip;

    switch (style) {
      case AttachmentStyle.secure:
        explanation =
            'You feel comfortable with emotional intimacy and can balance closeness with independence. You generally trust your partner and feel secure in relationships.';
        tip =
            'Continue nurturing your secure base by maintaining open communication and expressing appreciation.';
        break;
      case AttachmentStyle.anxiousPreoccupied:
        explanation =
            'You may worry about your relationship\'s stability and seek frequent reassurance. You value closeness highly but may sometimes fear abandonment.';
        tip =
            'Practice self-soothing techniques and communicate your needs clearly without seeking constant validation.';
        break;
      case AttachmentStyle.dismissiveAvoidant:
        explanation =
            'You tend to prioritize independence and may feel uncomfortable with too much emotional closeness. You might distance yourself when things get too intimate.';
        tip =
            'Practice gradually opening up and recognizing that vulnerability can strengthen your relationship.';
        break;
      case AttachmentStyle.fearfulAvoidant:
        explanation =
            'You may want closeness but also feel anxious about it. This can create a push-pull dynamic in relationships.';
        tip =
            'Work on building trust gradually and consider therapy to explore past experiences that may influence your patterns.';
        break;
      case AttachmentStyle.undetermined:
        explanation =
            'We need more data to determine your attachment style. Import more conversations to build your profile.';
        tip = 'Keep using the app to get more personalized insights.';
        break;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              explanation,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    height: 1.5,
                  ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.tips_and_updates,
                      size: 18, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      tip,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textPrimary,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConflictStyleCard(
      BuildContext context, PersonalityProfile profile) {
    final style = profile.conflictStyle ?? 'unknown';
    final displayStyle = style.isEmpty ? 'Not yet determined' : _capitalize(style);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getConflictIcon(style),
                  color: AppColors.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  displayStyle,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              _getConflictDescription(style),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (profile.repairInitiation != null ||
                profile.repairReceptivity != null) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildRepairScore(
                      context,
                      'Repair Initiative',
                      profile.repairInitiation,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildRepairScore(
                      context,
                      'Repair Receptivity',
                      profile.repairReceptivity,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRepairScore(BuildContext context, String label, double? score) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          score != null ? '${score.toInt()}/100' : '—',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: score != null
                    ? (score >= 60 ? AppColors.greenCard : AppColors.yellowCard)
                    : AppColors.textSecondary,
              ),
        ),
      ],
    );
  }

  IconData _getConflictIcon(String style) {
    switch (style.toLowerCase()) {
      case 'avoiding':
        return Icons.do_not_disturb;
      case 'accommodating':
        return Icons.volunteer_activism;
      case 'competing':
        return Icons.emoji_events;
      case 'compromising':
        return Icons.balance;
      case 'collaborating':
        return Icons.groups;
      default:
        return Icons.help_outline;
    }
  }

  String _getConflictDescription(String style) {
    switch (style.toLowerCase()) {
      case 'avoiding':
        return 'You tend to sidestep conflicts and may prefer to withdraw rather than engage directly.';
      case 'accommodating':
        return 'You often prioritize your partner\'s needs over your own during disagreements.';
      case 'competing':
        return 'You tend to advocate strongly for your position and may focus on winning arguments.';
      case 'compromising':
        return 'You seek middle ground and are willing to give up something to reach agreement.';
      case 'collaborating':
        return 'You aim for win-win solutions that address both partners\' needs fully.';
      default:
        return 'We need more data to determine your conflict style.';
    }
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
  }
}

class _CoachingTab extends ConsumerWidget {
  const _CoachingTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myPersonalityProfileProvider);

    return profileAsync.when(
      data: (profile) {
        if (profile == null) {
          return _buildEmptyState(context);
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Personalized Coaching',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Text(
                'AI-generated insights based on your profile',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 16),
              StrengthsNarrativeCard(narrative: profile.strengthsNarrative),
              const SizedBox(height: 16),
              GrowthAreasNarrativeCard(narrative: profile.growthAreasNarrative),
              const SizedBox(height: 16),
              CommunicationNarrativeCard(
                  narrative: profile.communicationNarrative),
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error),
    );
  }
}

Widget _buildEmptyState(BuildContext context) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.psychology_alt, size: 64, color: AppColors.textSecondary),
          const SizedBox(height: 16),
          Text(
            'No Profile Yet',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Import some WhatsApp conversations to build your personality profile based on your communication patterns.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.push('/home/import-chat'),
            icon: const Icon(Icons.upload_file),
            label: const Text('Import Chat'),
          ),
        ],
      ),
    ),
  );
}

Widget _buildErrorState(BuildContext context, Object error) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: AppColors.error),
          const SizedBox(height: 16),
          Text(
            'Failed to load profile',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            error.toString(),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}
