import { SharedProfile } from '@/lib/api';
import TraitGauge from './TraitGauge';

interface ProfileViewerProps {
  profile: SharedProfile;
}

export default function ProfileViewer({ profile }: ProfileViewerProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Relationship Referee</h1>
          <p className="text-gray-600 dark:text-gray-400">Personality Profile</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Last updated: {new Date(profile.lastUpdated).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Profile Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Profile Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Communication Style</div>
              <div className="text-lg font-semibold">{profile.communicationStyle}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Attachment Style</div>
              <div className="text-lg font-semibold">{profile.attachmentStyle}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</div>
              <div className="text-lg font-semibold">{profile.confidence}%</div>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Based on {profile.sessionsAnalyzed} session{profile.sessionsAnalyzed !== 1 ? 's' : ''} analyzed
          </div>
        </div>

        {/* Big Five Traits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Big Five Personality Traits</h2>
          <div className="space-y-4">
            <TraitGauge
              label="Openness"
              value={profile.openness}
              description="Openness to experience, curiosity, creativity"
            />
            <TraitGauge
              label="Conscientiousness"
              value={profile.conscientiousness}
              description="Organization, responsibility, self-discipline"
            />
            <TraitGauge
              label="Extraversion"
              value={profile.extraversion}
              description="Sociability, assertiveness, energy"
            />
            <TraitGauge
              label="Agreeableness"
              value={profile.agreeableness}
              description="Compassion, cooperation, trust"
            />
            <TraitGauge
              label="Neuroticism"
              value={profile.neuroticism}
              description="Emotional stability, anxiety, mood swings"
            />
          </div>
        </div>

        {/* Attachment Style */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Attachment Style: {profile.attachmentStyle}</h2>
          <div className="space-y-4">
            <TraitGauge
              label="Attachment Anxiety"
              value={profile.attachmentAnxiety}
              description="Fear of abandonment, need for reassurance"
              color="red"
            />
            <TraitGauge
              label="Attachment Avoidance"
              value={profile.attachmentAvoidance}
              description="Discomfort with intimacy, need for independence"
              color="yellow"
            />
          </div>
        </div>

        {/* Emotional Intelligence */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Emotional Intelligence</h2>
          <div className="space-y-4">
            <TraitGauge
              label="Emotional Awareness"
              value={profile.emotionalAwareness}
              description="Recognition and understanding of own emotions"
              color="green"
            />
            <TraitGauge
              label="Empathy"
              value={profile.empathy}
              description="Understanding and sharing others' feelings"
              color="green"
            />
            <TraitGauge
              label="Emotional Regulation"
              value={profile.emotionalRegulation}
              description="Managing and controlling emotional responses"
              color="green"
            />
          </div>
        </div>

        {/* Strengths Narrative */}
        {profile.strengthsNarrative && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">💪 Your Strengths</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {profile.strengthsNarrative}
            </p>
          </div>
        )}

        {/* Challenges Narrative */}
        {profile.challengesNarrative && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">🎯 Areas for Growth</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {profile.challengesNarrative}
            </p>
          </div>
        )}

        {/* Growth Narrative */}
        {profile.growthNarrative && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">🌱 Growth Opportunities</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {profile.growthNarrative}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-500 pt-8 pb-4">
          <p>Generated by Relationship Referee</p>
          <p className="mt-1">
            Personality profiles are based on validated psychological research including the Big Five model,
            attachment theory, and emotional intelligence frameworks.
          </p>
        </div>
      </div>
    </div>
  );
}
