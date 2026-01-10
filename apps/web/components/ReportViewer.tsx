import { SharedReport } from '@/lib/api';
import CardBadge from './CardBadge';
import BankChangeIndicator from './BankChangeIndicator';

interface ReportViewerProps {
  report: SharedReport;
}

export default function ReportViewer({ report }: ReportViewerProps) {
  // Determine overall score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Relationship Referee</h1>
          <p className="text-gray-600 dark:text-gray-400">Session Report</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {new Date(report.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Overall Score Card */}
        <div className={`${getScoreBgColor(report.overallScore)} rounded-lg p-8 text-center`}>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Overall Match Score
          </div>
          <div className={`text-6xl font-bold ${getScoreColor(report.overallScore)}`}>
            {report.overallScore}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">out of 100</div>
        </div>

        {/* Card Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Card Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardBadge type="GREEN" count={report.greenCardCount} />
            <CardBadge type="YELLOW" count={report.yellowCardCount} />
            <CardBadge type="RED" count={report.redCardCount} />
          </div>
        </div>

        {/* Emotional Bank Account */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <BankChangeIndicator change={report.bankChange} />
        </div>

        {/* Individual Scores */}
        {report.individualScores && report.individualScores.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Individual Scorecards</h2>
            <div className="space-y-4">
              {report.individualScores.map((score, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">{score.speaker}</h3>
                    <div className={`text-2xl font-bold ${getScoreColor(score.personalScore)}`}>
                      {score.personalScore}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <CardBadge type="GREEN" count={score.greenCardCount} size="sm" />
                    <CardBadge type="YELLOW" count={score.yellowCardCount} size="sm" />
                    <CardBadge type="RED" count={score.redCardCount} size="sm" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Bank Contribution:</span>
                      <span className={score.bankContribution >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {score.bankContribution >= 0 ? '+' : ''}
                        {score.bankContribution}
                      </span>
                    </div>
                    {score.repairAttemptCount > 0 && (
                      <div className="flex justify-between">
                        <span>Repair Attempts:</span>
                        <span className="text-green-600">{score.repairAttemptCount}</span>
                      </div>
                    )}
                    {score.horsemenUsed && score.horsemenUsed.length > 0 && (
                      <div className="mt-2">
                        <span className="text-red-600">Four Horsemen:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {score.horsemenUsed.map((horseman, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs"
                            >
                              {horseman}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach Feedback */}
        {(report.whatWentWell || report.tryNextTime || report.repairSuggestion) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Coach Feedback</h2>
            <div className="space-y-4">
              {report.whatWentWell && (
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">✅ What Went Well</h3>
                  <p className="text-gray-700 dark:text-gray-300">{report.whatWentWell}</p>
                </div>
              )}
              {report.tryNextTime && (
                <div>
                  <h3 className="font-semibold text-yellow-600 mb-2">💡 Try Next Time</h3>
                  <p className="text-gray-700 dark:text-gray-300">{report.tryNextTime}</p>
                </div>
              )}
              {report.repairSuggestion && (
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">🔧 Repair Suggestion</h3>
                  <p className="text-gray-700 dark:text-gray-300">{report.repairSuggestion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Topic Tags */}
        {report.topicTags && report.topicTags.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Discussion Topics</h2>
            <div className="flex flex-wrap gap-2">
              {report.topicTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Highlights */}
        {report.cards && report.cards.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Conversation Highlights</h2>
            <div className="space-y-3">
              {report.cards.map((card, index) => (
                <div
                  key={index}
                  className={`border-l-4 pl-4 py-2 ${
                    card.type === 'GREEN'
                      ? 'border-green-500'
                      : card.type === 'YELLOW'
                      ? 'border-yellow-500'
                      : 'border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          card.type === 'GREEN'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : card.type === 'YELLOW'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {card.type}
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {card.behavior}
                      </span>
                    </div>
                    {card.speaker && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">{card.speaker}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-1">"{card.quote}"</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{card.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-500 pt-8 pb-4">
          <p>Generated by Relationship Referee</p>
          <p className="mt-1">
            Source: {report.sourceType === 'WHATSAPP_CHAT' ? 'WhatsApp Import' : 'Audio Recording'}
          </p>
        </div>
      </div>
    </div>
  );
}
