import { Metadata } from 'next';
import { fetchSharedReport } from '@/lib/api';
import ReportViewer from '@/components/ReportViewer';

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  try {
    const report = await fetchSharedReport(token);

    return {
      title: `Relationship Referee - Session Report (Score: ${report.overallScore})`,
      description: `View this relationship coaching session report. Overall score: ${report.overallScore}/100`,
      openGraph: {
        title: `Relationship Coaching Session Report`,
        description: `Overall Score: ${report.overallScore}/100 | Green: ${report.greenCardCount} | Yellow: ${report.yellowCardCount} | Red: ${report.redCardCount}`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Relationship Coaching Session Report',
        description: `Overall Score: ${report.overallScore}/100`,
      },
    };
  } catch (error) {
    return {
      title: 'Relationship Referee - Report Not Found',
      description: 'This shared report is not available',
    };
  }
}

export default async function SharedReportPage({ params }: Props) {
  const { token } = await params;

  try {
    const report = await fetchSharedReport(token);
    return <ReportViewer report={report} />;
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Report Not Available</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'This shared report could not be found or has expired.'}
          </p>
          <p className="text-sm text-gray-500">
            Shared links are temporary and can be revoked by the owner.
          </p>
        </div>
      </div>
    );
  }
}
