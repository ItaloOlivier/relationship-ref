import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/design_tokens.dart';

/// Skeleton loading component for content-aware loading states
class SkeletonLoading extends StatelessWidget {
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;

  const SkeletonLoading({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Shimmer.fromColors(
      baseColor: isDark
          ? Colors.white.withValues(alpha: 0.1)
          : Colors.grey.shade300,
      highlightColor: isDark
          ? Colors.white.withValues(alpha: 0.2)
          : Colors.grey.shade100,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: borderRadius ?? BorderRadius.circular(DesignTokens.radiusMd),
        ),
      ),
    );
  }
}

/// Skeleton for Emotional Bank card on home screen
class EmotionalBankSkeleton extends StatelessWidget {
  const EmotionalBankSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                SkeletonLoading(
                  width: DesignTokens.iconMd,
                  height: DesignTokens.iconMd,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusCircular),
                ),
                const SizedBox(width: 8),
                const SkeletonLoading(width: 100, height: 20),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const SkeletonLoading(width: 120, height: 42),
                const SizedBox(width: 8),
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: const SkeletonLoading(width: 60, height: 20),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const SkeletonLoading(
              width: double.infinity,
              height: 4,
              borderRadius: BorderRadius.all(Radius.circular(2)),
            ),
          ],
        ),
      ),
    );
  }
}

/// Skeleton for Streak or Quests cards
class StatCardSkeleton extends StatelessWidget {
  const StatCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            SkeletonLoading(
              width: 32,
              height: 32,
              borderRadius: BorderRadius.circular(DesignTokens.radiusCircular),
            ),
            const SizedBox(height: 8),
            const SkeletonLoading(width: 40, height: 32),
            const SizedBox(height: 4),
            const SkeletonLoading(width: 80, height: 16),
          ],
        ),
      ),
    );
  }
}

/// Skeleton for session list items
class SessionListItemSkeleton extends StatelessWidget {
  const SessionListItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: SkeletonLoading(
          width: 40,
          height: 40,
          borderRadius: BorderRadius.circular(DesignTokens.radiusCircular),
        ),
        title: const SkeletonLoading(width: 150, height: 16),
        subtitle: const Padding(
          padding: EdgeInsets.only(top: 4),
          child: SkeletonLoading(width: 100, height: 14),
        ),
        trailing: SkeletonLoading(
          width: DesignTokens.iconMd,
          height: DesignTokens.iconMd,
          borderRadius: BorderRadius.circular(DesignTokens.radiusCircular),
        ),
      ),
    );
  }
}

/// Skeleton for recent sessions list on home screen
class RecentSessionsSkeleton extends StatelessWidget {
  const RecentSessionsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: const [
        SessionListItemSkeleton(),
        SessionListItemSkeleton(),
        SessionListItemSkeleton(),
      ],
    );
  }
}

/// Skeleton for session history screen
class SessionHistorySkeleton extends StatelessWidget {
  const SessionHistorySkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 10,
      itemBuilder: (context, index) => const SessionListItemSkeleton(),
    );
  }
}

/// Skeleton for quest cards on gamification screen
class QuestCardSkeleton extends StatelessWidget {
  const QuestCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                SkeletonLoading(
                  width: DesignTokens.iconLg,
                  height: DesignTokens.iconLg,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusCircular),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonLoading(width: 180, height: 18),
                      SizedBox(height: 4),
                      SkeletonLoading(width: 120, height: 14),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const SkeletonLoading(
              width: double.infinity,
              height: 8,
              borderRadius: BorderRadius.all(Radius.circular(4)),
            ),
            const SizedBox(height: 8),
            const SkeletonLoading(width: 60, height: 14),
          ],
        ),
      ),
    );
  }
}

/// Skeleton for gamification dashboard
class GamificationDashboardSkeleton extends StatelessWidget {
  const GamificationDashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Stats row
        Row(
          children: const [
            Expanded(child: StatCardSkeleton()),
            SizedBox(width: 16),
            Expanded(child: StatCardSkeleton()),
          ],
        ),
        const SizedBox(height: 16),
        const EmotionalBankSkeleton(),
        const SizedBox(height: 24),
        const SkeletonLoading(width: 120, height: 24),
        const SizedBox(height: 12),
        const QuestCardSkeleton(),
        const QuestCardSkeleton(),
        const QuestCardSkeleton(),
      ],
    );
  }
}

/// Skeleton for match report screen
class ReportSkeleton extends StatelessWidget {
  const ReportSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Score gauge
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                SkeletonLoading(
                  width: 200,
                  height: 200,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusCircular),
                ),
                const SizedBox(height: 16),
                const SkeletonLoading(width: 150, height: 32),
                const SizedBox(height: 8),
                const SkeletonLoading(width: 200, height: 16),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Cards summary
        Row(
          children: const [
            Expanded(child: StatCardSkeleton()),
            SizedBox(width: 12),
            Expanded(child: StatCardSkeleton()),
            SizedBox(width: 12),
            Expanded(child: StatCardSkeleton()),
          ],
        ),
        const SizedBox(height: 24),
        const SkeletonLoading(width: 120, height: 24),
        const SizedBox(height: 12),
        _FeedbackItemSkeleton(),
        _FeedbackItemSkeleton(),
        _FeedbackItemSkeleton(),
      ],
    );
  }
}

class _FeedbackItemSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Row(
              children: [
                SkeletonLoading(width: 24, height: 24),
                SizedBox(width: 8),
                SkeletonLoading(width: 150, height: 18),
              ],
            ),
            SizedBox(height: 12),
            SkeletonLoading(width: double.infinity, height: 14),
            SizedBox(height: 4),
            SkeletonLoading(width: double.infinity, height: 14),
            SizedBox(height: 4),
            SkeletonLoading(width: 200, height: 14),
          ],
        ),
      ),
    );
  }
}
