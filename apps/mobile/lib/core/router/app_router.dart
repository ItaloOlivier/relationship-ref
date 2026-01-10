import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/auth/presentation/screens/auth_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/session/presentation/screens/session_screen.dart';
import '../../features/session/presentation/screens/chat_import_screen.dart';
import '../../features/report/presentation/screens/report_screen.dart';
import '../../features/history/presentation/screens/history_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/gamification/presentation/screens/gamification_screen.dart';
import '../../features/insights/presentation/screens/insights_screen.dart';
import '../../features/personality/presentation/screens/personality_profile_screen.dart';
import '../../features/personality/presentation/screens/couple_comparison_screen.dart';
import '../../features/personality/presentation/screens/relationship_coaching_screen.dart';
import '../../features/relationship/presentation/screens/relationship_list_screen.dart';
import '../../features/relationship/presentation/screens/relationship_detail_screen.dart';
import '../../features/relationship/presentation/screens/participant_profile_screen.dart';
import '../auth/auth_provider.dart';
import '../navigation/app_navigation_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/onboarding',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isOnboarding = state.matchedLocation == '/onboarding';
      final isAuth = state.matchedLocation.startsWith('/auth');

      // If not logged in and not on auth pages, redirect to auth
      if (!isLoggedIn && !isOnboarding && !isAuth) {
        return '/auth';
      }

      // If logged in and on auth pages, redirect to home
      if (isLoggedIn && (isOnboarding || isAuth)) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/auth',
        name: 'auth',
        builder: (context, state) => const AuthScreen(),
      ),
      // Main app shell with bottom navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppNavigationShell(navigationShell: navigationShell);
        },
        branches: [
          // Branch 1: Home
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                name: 'home',
                builder: (context, state) => const HomeScreen(),
                routes: [
                  GoRoute(
                    path: 'session',
                    name: 'session',
                    builder: (context, state) => const SessionScreen(),
                  ),
                  GoRoute(
                    path: 'import-chat',
                    name: 'import-chat',
                    builder: (context, state) => const ChatImportScreen(),
                  ),
                  GoRoute(
                    path: 'insights',
                    name: 'insights',
                    builder: (context, state) => const InsightsScreen(),
                  ),
                ],
              ),
            ],
          ),
          // Branch 2: History (Reports)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/history',
                name: 'history',
                builder: (context, state) => const HistoryScreen(),
                routes: [
                  GoRoute(
                    path: 'report/:sessionId',
                    name: 'report',
                    builder: (context, state) {
                      final sessionId = state.pathParameters['sessionId']!;
                      return ReportScreen(sessionId: sessionId);
                    },
                  ),
                ],
              ),
            ],
          ),
          // Branch 3: Gamification (Progress)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/gamification',
                name: 'gamification',
                builder: (context, state) => const GamificationScreen(),
              ),
            ],
          ),
          // Branch 4: Settings
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/settings',
                name: 'settings',
                builder: (context, state) => const SettingsScreen(),
                routes: [
                  // Personality profile routes (nested under settings)
                  GoRoute(
                    path: 'personality',
                    name: 'personality',
                    builder: (context, state) => const PersonalityProfileScreen(),
                    routes: [
                      GoRoute(
                        path: 'comparison',
                        name: 'personality-comparison',
                        builder: (context, state) => const CoupleComparisonScreen(),
                      ),
                      GoRoute(
                        path: 'coaching',
                        name: 'personality-coaching',
                        builder: (context, state) => const RelationshipCoachingScreen(),
                      ),
                    ],
                  ),
                  // Relationship directory routes (nested under settings)
                  GoRoute(
                    path: 'relationships',
                    name: 'relationships',
                    builder: (context, state) => const RelationshipListScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      // Standalone relationship routes (outside main shell)
      GoRoute(
        path: '/relationships/:relationshipId',
        name: 'relationship-detail',
        builder: (context, state) {
          final relationshipId = state.pathParameters['relationshipId']!;
          return RelationshipDetailScreen(relationshipId: relationshipId);
        },
        routes: [
          GoRoute(
            path: 'participants/:userId',
            name: 'participant-profile',
            builder: (context, state) {
              final relationshipId = state.pathParameters['relationshipId']!;
              final userId = state.pathParameters['userId']!;
              return ParticipantProfileScreen(
                userId: userId,
                relationshipId: relationshipId,
              );
            },
          ),
        ],
      ),
      // Alternate route for session reports (standalone)
      GoRoute(
        path: '/sessions/:sessionId/report',
        name: 'session-report',
        builder: (context, state) {
          final sessionId = state.pathParameters['sessionId']!;
          return ReportScreen(sessionId: sessionId);
        },
      ),
    ],
  );
});
