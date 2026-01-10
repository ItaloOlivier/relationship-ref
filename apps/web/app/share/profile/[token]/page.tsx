import { Metadata } from 'next';
import { fetchSharedProfile } from '@/lib/api';
import ProfileViewer from '@/components/ProfileViewer';

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  try {
    const profile = await fetchSharedProfile(token);

    return {
      title: `Relationship Referee - Personality Profile`,
      description: `View this personality profile analysis based on ${profile.sessionsAnalyzed} sessions`,
      openGraph: {
        title: 'Personality Profile - Relationship Referee',
        description: `Psychological insights from ${profile.sessionsAnalyzed} analyzed conversations`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Personality Profile',
        description: `Analysis based on ${profile.sessionsAnalyzed} sessions`,
      },
    };
  } catch (error) {
    return {
      title: 'Relationship Referee - Profile Not Found',
      description: 'This shared profile is not available',
    };
  }
}

export default async function SharedProfilePage({ params }: Props) {
  const { token } = await params;

  try {
    const profile = await fetchSharedProfile(token);
    return <ProfileViewer profile={profile} />;
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Profile Not Available</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'This shared profile could not be found or has expired.'}
          </p>
          <p className="text-sm text-gray-500">
            Shared links are temporary and can be revoked by the owner.
          </p>
        </div>
      </div>
    );
  }
}
