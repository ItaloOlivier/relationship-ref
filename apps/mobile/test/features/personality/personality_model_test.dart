import 'package:flutter_test/flutter_test.dart';
import 'package:relationship_referee/features/personality/domain/personality_profile_model.dart';
import 'package:relationship_referee/features/personality/domain/relationship_dynamic_model.dart';
import 'package:relationship_referee/features/personality/domain/couple_comparison_model.dart';

void main() {
  group('AttachmentStyle', () {
    test('fromString parses SECURE correctly', () {
      expect(AttachmentStyleX.fromString('SECURE'), AttachmentStyle.secure);
    });

    test('fromString parses ANXIOUS_PREOCCUPIED correctly', () {
      expect(AttachmentStyleX.fromString('ANXIOUS_PREOCCUPIED'),
          AttachmentStyle.anxiousPreoccupied);
    });

    test('fromString parses DISMISSIVE_AVOIDANT correctly', () {
      expect(AttachmentStyleX.fromString('DISMISSIVE_AVOIDANT'),
          AttachmentStyle.dismissiveAvoidant);
    });

    test('fromString parses FEARFUL_AVOIDANT correctly', () {
      expect(AttachmentStyleX.fromString('FEARFUL_AVOIDANT'),
          AttachmentStyle.fearfulAvoidant);
    });

    test('fromString returns undetermined for unknown values', () {
      expect(AttachmentStyleX.fromString('UNKNOWN'), AttachmentStyle.undetermined);
    });

    test('displayName returns correct values', () {
      expect(AttachmentStyle.secure.displayName, 'Secure');
      expect(AttachmentStyle.anxiousPreoccupied.displayName, 'Anxious');
      expect(AttachmentStyle.dismissiveAvoidant.displayName, 'Avoidant');
      expect(AttachmentStyle.fearfulAvoidant.displayName, 'Fearful-Avoidant');
      expect(AttachmentStyle.undetermined.displayName, 'Not Yet Determined');
    });
  });

  group('CommunicationStyle', () {
    test('fromString parses all styles correctly', () {
      expect(CommunicationStyleX.fromString('PLACATER'),
          CommunicationStyle.placater);
      expect(
          CommunicationStyleX.fromString('BLAMER'), CommunicationStyle.blamer);
      expect(CommunicationStyleX.fromString('COMPUTER'),
          CommunicationStyle.computer);
      expect(CommunicationStyleX.fromString('DISTRACTER'),
          CommunicationStyle.distracter);
      expect(CommunicationStyleX.fromString('LEVELER'),
          CommunicationStyle.leveler);
      expect(CommunicationStyleX.fromString('MIXED'), CommunicationStyle.mixed);
    });

    test('fromString returns mixed for unknown values', () {
      expect(CommunicationStyleX.fromString('UNKNOWN'), CommunicationStyle.mixed);
    });
  });

  group('PersonalityProfile', () {
    test('fromJson parses complete profile', () {
      final json = {
        'id': 'profile-123',
        'userId': 'user-456',
        'openness': 75.0,
        'conscientiousness': 65.0,
        'extraversion': 55.0,
        'agreeableness': 80.0,
        'neuroticism': 35.0,
        'attachmentStyle': 'SECURE',
        'attachmentAnxiety': 25.0,
        'attachmentAvoidance': 20.0,
        'communicationStyle': 'LEVELER',
        'conflictStyle': 'collaborating',
        'emotionalAwareness': 70.0,
        'empathyScore': 75.0,
        'emotionalRegulation': 65.0,
        'confidenceScore': 85.0,
        'sessionsAnalyzed': 10,
        'strengthsNarrative': 'You communicate well.',
        'growthAreasNarrative': 'Work on active listening.',
        'communicationNarrative': 'Your style is healthy.',
        'attachmentDescription': 'Secure attachment pattern.',
        'communicationDescription': 'Direct and authentic.',
        'traitDescriptions': {
          'openness': 'High creativity',
          'conscientiousness': 'Well organized',
        },
        'updatedAt': '2026-01-10T12:00:00.000Z',
      };

      final profile = PersonalityProfile.fromJson(json);

      expect(profile.id, 'profile-123');
      expect(profile.userId, 'user-456');
      expect(profile.openness, 75.0);
      expect(profile.conscientiousness, 65.0);
      expect(profile.extraversion, 55.0);
      expect(profile.agreeableness, 80.0);
      expect(profile.neuroticism, 35.0);
      expect(profile.attachmentStyle, AttachmentStyle.secure);
      expect(profile.attachmentAnxiety, 25.0);
      expect(profile.attachmentAvoidance, 20.0);
      expect(profile.communicationStyle, CommunicationStyle.leveler);
      expect(profile.conflictStyle, 'collaborating');
      expect(profile.emotionalAwareness, 70.0);
      expect(profile.empathyScore, 75.0);
      expect(profile.emotionalRegulation, 65.0);
      expect(profile.confidenceScore, 85.0);
      expect(profile.sessionsAnalyzed, 10);
      expect(profile.strengthsNarrative, 'You communicate well.');
      expect(profile.attachmentDescription, 'Secure attachment pattern.');
      expect(profile.traitDescriptions.openness, 'High creativity');
      expect(profile.hasEnoughData, true);
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'id': 'profile-123',
        'userId': 'user-456',
      };

      final profile = PersonalityProfile.fromJson(json);

      expect(profile.id, 'profile-123');
      expect(profile.openness, null);
      expect(profile.attachmentStyle, AttachmentStyle.undetermined);
      expect(profile.communicationStyle, CommunicationStyle.mixed);
      expect(profile.confidenceScore, 0);
      expect(profile.sessionsAnalyzed, 0);
      expect(profile.hasEnoughData, false);
    });

    test('bigFive getter returns correct traits', () {
      final profile = PersonalityProfile(
        id: 'test',
        userId: 'user',
        openness: 70,
        conscientiousness: 60,
        extraversion: 50,
        agreeableness: 80,
        neuroticism: 30,
      );

      final bigFive = profile.bigFive;
      expect(bigFive.openness, 70);
      expect(bigFive.conscientiousness, 60);
      expect(bigFive.extraversion, 50);
      expect(bigFive.agreeableness, 80);
      expect(bigFive.neuroticism, 30);
    });

    test('emotionalIntelligence getter calculates average', () {
      final profile = PersonalityProfile(
        id: 'test',
        userId: 'user',
        emotionalAwareness: 80,
        empathyScore: 70,
        emotionalRegulation: 60,
      );

      final eq = profile.emotionalIntelligence;
      expect(eq.averageScore, 70.0);
    });
  });

  group('RelationshipDynamic', () {
    test('fromJson parses complete dynamics', () {
      final json = {
        'id': 'dyn-123',
        'coupleId': 'couple-456',
        'pursuerWithdrawer': true,
        'pursuerId': 'user-1',
        'emotionalReciprocity': 75.0,
        'validationBalance': 70.0,
        'supportBalance': 80.0,
        'escalationTendency': 30.0,
        'deescalationSkill': 65.0,
        'resolutionRate': 70.0,
        'positiveToNegativeRatio': 5.5,
        'relationshipStrengths': ['humor', 'appreciation'],
        'growthOpportunities': ['active listening'],
        'dynamicNarrative': 'Your relationship is strong.',
        'coachingFocus': 'Work on listening.',
        'confidenceScore': 80.0,
        'sessionsAnalyzed': 8,
      };

      final dynamics = RelationshipDynamic.fromJson(json);

      expect(dynamics.id, 'dyn-123');
      expect(dynamics.coupleId, 'couple-456');
      expect(dynamics.pursuerWithdrawer, true);
      expect(dynamics.pursuerId, 'user-1');
      expect(dynamics.emotionalReciprocity, 75.0);
      expect(dynamics.positiveToNegativeRatio, 5.5);
      expect(dynamics.relationshipStrengths, ['humor', 'appreciation']);
      expect(dynamics.growthOpportunities, ['active listening']);
      expect(dynamics.hasHealthyRatio, true);
      expect(dynamics.ratioDescription, contains('Healthy'));
    });

    test('hasHealthyRatio returns false when ratio below 5', () {
      final dynamics = RelationshipDynamic(
        id: 'test',
        positiveToNegativeRatio: 3.0,
      );

      expect(dynamics.hasHealthyRatio, false);
      expect(dynamics.ratioDescription, contains('Needs attention'));
    });
  });

  group('CoupleComparison', () {
    test('fromJson parses partner profiles and insights', () {
      final json = {
        'partner1': {
          'userId': 'user-1',
          'name': 'Alice',
          'profile': {
            'id': 'profile-1',
            'userId': 'user-1',
            'attachmentStyle': 'SECURE',
            'sessionsAnalyzed': 5,
          },
        },
        'partner2': {
          'userId': 'user-2',
          'name': 'Bob',
          'profile': {
            'id': 'profile-2',
            'userId': 'user-2',
            'attachmentStyle': 'ANXIOUS_PREOCCUPIED',
            'sessionsAnalyzed': 3,
          },
        },
        'dynamics': {
          'id': 'dyn-1',
          'coupleId': 'couple-1',
          'positiveToNegativeRatio': 4.5,
        },
        'insights': [
          'Both partners show complementary strengths.',
          'Work on understanding different attachment needs.',
        ],
      };

      final comparison = CoupleComparison.fromJson(json);

      expect(comparison.partner1.name, 'Alice');
      expect(comparison.partner1.profile?.attachmentStyle, AttachmentStyle.secure);
      expect(comparison.partner2.name, 'Bob');
      expect(comparison.partner2.profile?.attachmentStyle,
          AttachmentStyle.anxiousPreoccupied);
      expect(comparison.dynamics?.positiveToNegativeRatio, 4.5);
      expect(comparison.insights.length, 2);
      expect(comparison.hasBothProfiles, true);
    });

    test('hasBothProfiles returns false when partner profile is null', () {
      final comparison = CoupleComparison(
        partner1: PartnerProfile(
          userId: 'user-1',
          name: 'Alice',
          profile: PersonalityProfile(id: 'p1', userId: 'user-1'),
        ),
        partner2: PartnerProfile(
          userId: 'user-2',
          name: 'Bob',
          profile: null,
        ),
      );

      expect(comparison.hasBothProfiles, false);
    });
  });

  group('EmotionalIntelligence', () {
    test('averageScore calculates correctly', () {
      const eq = EmotionalIntelligence(
        emotionalAwareness: 80,
        empathyScore: 70,
        emotionalRegulation: 60,
      );

      expect(eq.averageScore, 70.0);
    });

    test('averageScore handles null values', () {
      const eq = EmotionalIntelligence(
        emotionalAwareness: 80,
        empathyScore: null,
        emotionalRegulation: 60,
      );

      expect(eq.averageScore, 70.0);
    });

    test('averageScore returns 0 when all null', () {
      const eq = EmotionalIntelligence();
      expect(eq.averageScore, 0);
    });
  });
}
