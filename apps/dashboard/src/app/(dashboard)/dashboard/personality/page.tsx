'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { PersonalityProfile } from '@/types';

type TabType = 'overview' | 'traits' | 'attachment' | 'coaching';

export default function PersonalityPage() {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getMyPersonality();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load personality profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Personality Profile</h1>
          <p className="text-muted-foreground">Your psychological profile based on communication patterns</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No personality profile available yet. Complete more sessions to build your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Personality Profile</h1>
        <p className="text-muted-foreground">Your psychological profile based on {profile.sessionCount} sessions</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'traits', label: 'Big Five Traits' },
            { id: 'attachment', label: 'Attachment Style' },
            { id: 'coaching', label: 'Coaching Tips' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Personality Summary</CardTitle>
              <CardDescription>AI-generated insights about your communication style</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{profile.narrative}</p>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Communication Style</CardTitle>
                <span className="text-2xl">💬</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.communicationStyle || 'Leveler'}</div>
                <p className="text-xs text-muted-foreground mt-1">Based on Satir model</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attachment Style</CardTitle>
                <span className="text-2xl">❤️</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.attachmentStyle || 'Secure'}</div>
                <p className="text-xs text-muted-foreground mt-1">Bowlby/Ainsworth theory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emotional Intelligence</CardTitle>
                <span className="text-2xl">🧠</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.emotionalIntelligence?.overall.toFixed(0) || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Overall EQ score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                <span className="text-2xl">📊</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(profile.confidence * 100)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Based on {profile.sessionCount} sessions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Big Five Traits Tab */}
      {activeTab === 'traits' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Big Five Personality Traits (OCEAN)</CardTitle>
              <CardDescription>The five broad dimensions of personality based on validated research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Openness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Openness to Experience</h3>
                    <p className="text-sm text-muted-foreground">Curiosity, creativity, willingness to try new things</p>
                  </div>
                  <span className="text-xl font-bold">{profile.bigFive?.openness.toFixed(1) || 0}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${(profile.bigFive?.openness || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Conscientiousness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Conscientiousness</h3>
                    <p className="text-sm text-muted-foreground">Organization, reliability, self-discipline</p>
                  </div>
                  <span className="text-xl font-bold">{profile.bigFive?.conscientiousness.toFixed(1) || 0}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                    style={{ width: `${(profile.bigFive?.conscientiousness || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Extraversion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Extraversion</h3>
                    <p className="text-sm text-muted-foreground">Sociability, assertiveness, enthusiasm</p>
                  </div>
                  <span className="text-xl font-bold">{profile.bigFive?.extraversion.toFixed(1) || 0}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    style={{ width: `${(profile.bigFive?.extraversion || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Agreeableness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Agreeableness</h3>
                    <p className="text-sm text-muted-foreground">Compassion, cooperation, trust</p>
                  </div>
                  <span className="text-xl font-bold">{profile.bigFive?.agreeableness.toFixed(1) || 0}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                    style={{ width: `${(profile.bigFive?.agreeableness || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Neuroticism */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Neuroticism (Emotional Stability)</h3>
                    <p className="text-sm text-muted-foreground">Tendency toward anxiety, worry, emotional reactivity</p>
                  </div>
                  <span className="text-xl font-bold">{profile.bigFive?.neuroticism.toFixed(1) || 0}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                    style={{ width: `${(profile.bigFive?.neuroticism || 0) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attachment Style Tab */}
      {activeTab === 'attachment' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attachment Style: {profile.attachmentStyle || 'Unknown'}</CardTitle>
              <CardDescription>Based on Bowlby and Ainsworth attachment theory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">What this means:</h3>
                <p className="text-sm text-muted-foreground">
                  {profile.attachmentStyle === 'SECURE' && 'You have a healthy balance of intimacy and independence. You trust others and are comfortable with emotional closeness.'}
                  {profile.attachmentStyle === 'ANXIOUS' && 'You crave closeness and intimacy but often worry about rejection or abandonment. You may seek frequent reassurance from your partner.'}
                  {profile.attachmentStyle === 'AVOIDANT' && 'You value independence and self-sufficiency, sometimes at the expense of emotional intimacy. You may feel uncomfortable with too much closeness.'}
                  {profile.attachmentStyle === 'FEARFUL' && 'You desire closeness but fear being hurt, leading to a push-pull dynamic in relationships. You may struggle with trusting others.'}
                  {!profile.attachmentStyle && 'Complete more sessions to determine your attachment style.'}
                </p>
              </div>

              {/* Emotional Intelligence Breakdown */}
              {profile.emotionalIntelligence && (
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-4">Emotional Intelligence Breakdown</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Self-Awareness</span>
                        <span className="text-sm font-bold">{profile.emotionalIntelligence.awareness.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${profile.emotionalIntelligence.awareness * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Empathy</span>
                        <span className="text-sm font-bold">{profile.emotionalIntelligence.empathy.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${profile.emotionalIntelligence.empathy * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Emotional Regulation</span>
                        <span className="text-sm font-bold">{profile.emotionalIntelligence.regulation.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${profile.emotionalIntelligence.regulation * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication Style */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Style: {profile.communicationStyle || 'Unknown'}</CardTitle>
              <CardDescription>Based on Virginia Satir&apos;s communication patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {profile.communicationStyle === 'PLACATER' && 'You tend to prioritize harmony and avoiding conflict, sometimes at the expense of your own needs. You may frequently apologize or agree even when you disagree.'}
                {profile.communicationStyle === 'BLAMER' && 'You tend to point out faults and hold others responsible when things go wrong. This can come across as critical or accusatory in conflicts.'}
                {profile.communicationStyle === 'COMPUTER' && 'You approach conflicts intellectually and logically, sometimes appearing detached or overly analytical. You may focus on facts over feelings.'}
                {profile.communicationStyle === 'DISTRACTER' && 'You tend to avoid conflict by changing the subject or making jokes. This can prevent difficult conversations from reaching resolution.'}
                {profile.communicationStyle === 'LEVELER' && 'You communicate openly and honestly, expressing both thoughts and feelings clearly. This is the healthiest communication pattern for relationships.'}
                {!profile.communicationStyle && 'Complete more sessions to determine your communication style.'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coaching Tips Tab */}
      {activeTab === 'coaching' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Coaching Tips</CardTitle>
              <CardDescription>Recommendations based on your personality profile and communication patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* General Tips Based on Attachment Style */}
              <div>
                <h3 className="font-semibold mb-2">For Your Attachment Style ({profile.attachmentStyle || 'Unknown'})</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {profile.attachmentStyle === 'SECURE' && (
                    <>
                      <li>Continue modeling healthy communication for your partner</li>
                      <li>Help your partner feel safe expressing their needs</li>
                      <li>Maintain the balance between closeness and independence</li>
                    </>
                  )}
                  {profile.attachmentStyle === 'ANXIOUS' && (
                    <>
                      <li>Practice self-soothing when you feel the urge to seek reassurance</li>
                      <li>Build confidence in your relationship through positive self-talk</li>
                      <li>Communicate your needs directly rather than seeking implicit validation</li>
                      <li>Develop independence through personal hobbies and friendships</li>
                    </>
                  )}
                  {profile.attachmentStyle === 'AVOIDANT' && (
                    <>
                      <li>Practice sharing your feelings, even when it feels uncomfortable</li>
                      <li>Recognize when you&apos;re withdrawing and communicate that to your partner</li>
                      <li>Challenge the belief that needing others is a weakness</li>
                      <li>Set aside dedicated time for emotional intimacy</li>
                    </>
                  )}
                  {profile.attachmentStyle === 'FEARFUL' && (
                    <>
                      <li>Work on building trust gradually through small vulnerabilities</li>
                      <li>Recognize when fear is driving your behavior</li>
                      <li>Communicate your internal conflict to your partner</li>
                      <li>Consider working with a therapist on attachment healing</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Communication Style Tips */}
              {profile.communicationStyle && (
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-2">For Your Communication Style ({profile.communicationStyle})</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {profile.communicationStyle === 'PLACATER' && (
                      <>
                        <li>Practice saying &quot;no&quot; or expressing disagreement in low-stakes situations</li>
                        <li>Remember that conflict doesn&apos;t mean the relationship is failing</li>
                        <li>Use &quot;I feel&quot; statements to express your own needs</li>
                      </>
                    )}
                    {profile.communicationStyle === 'BLAMER' && (
                      <>
                        <li>Before criticizing, pause and consider the other person&apos;s perspective</li>
                        <li>Replace &quot;you always&quot; with &quot;I feel&quot; statements</li>
                        <li>Focus on specific behaviors rather than character attacks</li>
                      </>
                    )}
                    {profile.communicationStyle === 'COMPUTER' && (
                      <>
                        <li>Balance logic with emotion by naming your feelings</li>
                        <li>Ask your partner about their feelings, not just facts</li>
                        <li>Practice being vulnerable and sharing emotional reactions</li>
                      </>
                    )}
                    {profile.communicationStyle === 'DISTRACTER' && (
                      <>
                        <li>Notice when you&apos;re avoiding difficult topics and gently redirect</li>
                        <li>Practice staying present during conflict, even when it&apos;s uncomfortable</li>
                        <li>Set aside dedicated time to address important issues</li>
                      </>
                    )}
                    {profile.communicationStyle === 'LEVELER' && (
                      <>
                        <li>Continue modeling open, honest communication</li>
                        <li>Help your partner feel safe being vulnerable with you</li>
                        <li>Balance honesty with compassion</li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              {/* EQ Development */}
              {profile.emotionalIntelligence && (
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-2">Emotional Intelligence Development</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {profile.emotionalIntelligence.awareness < 0.7 && (
                      <li>Practice naming your emotions throughout the day to build self-awareness</li>
                    )}
                    {profile.emotionalIntelligence.empathy < 0.7 && (
                      <li>Try to imagine your partner&apos;s perspective before responding in conflict</li>
                    )}
                    {profile.emotionalIntelligence.regulation < 0.7 && (
                      <li>Develop calming techniques like deep breathing or taking breaks during heated discussions</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gottman Principles */}
          <Card>
            <CardHeader>
              <CardTitle>Research-Backed Relationship Principles</CardTitle>
              <CardDescription>Based on Dr. John Gottman&apos;s decades of research</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Maintain a 5:1 ratio of positive to negative interactions</li>
                <li>Turn toward your partner&apos;s bids for connection rather than away or against</li>
                <li>Build a culture of appreciation by expressing gratitude daily</li>
                <li>Manage conflict by staying calm and taking breaks when flooded</li>
                <li>Understand and respect each other&apos;s dreams and aspirations</li>
                <li>Create shared meaning through rituals, goals, and values</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
