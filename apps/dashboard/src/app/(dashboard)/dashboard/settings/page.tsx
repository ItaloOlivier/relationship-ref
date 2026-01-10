'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { User } from '@/types';

type TabType = 'profile' | 'password' | 'privacy' | 'notifications';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Privacy settings
  const [audioRetention, setAudioRetention] = useState<'DELETE_AFTER_TRANSCRIPTION' | 'KEEP_30_DAYS' | 'KEEP_FOREVER'>('DELETE_AFTER_TRANSCRIPTION');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      setName(userData.name || '');
      setEmail(userData.email);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.updateProfile({ name, email });
      alert('Profile updated successfully!');
      await loadUser();
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);

    try {
      await api.updatePassword(currentPassword, newPassword);
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      alert(error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data including sessions, relationships, and personality profiles. Are you absolutely sure?')) {
      return;
    }

    try {
      await api.deleteAccount();
      alert('Account deleted successfully');
      api.logout();
      router.push('/login');
    } catch (error: any) {
      alert(error.message || 'Failed to delete account');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'password', label: 'Password' },
            { id: 'privacy', label: 'Privacy & Data' },
            { id: 'notifications', label: 'Notifications' },
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving} isLoading={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={loadUser}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password for security</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  At least 8 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving} isLoading={isSaving}>
                  {isSaving ? 'Changing...' : 'Change Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Privacy & Data Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio Recording Privacy</CardTitle>
              <CardDescription>Control how your audio recordings are stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="audioRetention"
                    checked={audioRetention === 'DELETE_AFTER_TRANSCRIPTION'}
                    onChange={() => setAudioRetention('DELETE_AFTER_TRANSCRIPTION')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">Delete after transcription (Recommended)</p>
                    <p className="text-sm text-muted-foreground">
                      Audio files are deleted immediately after transcription completes. Only the text transcript is kept.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="audioRetention"
                    checked={audioRetention === 'KEEP_30_DAYS'}
                    onChange={() => setAudioRetention('KEEP_30_DAYS')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">Keep for 30 days</p>
                    <p className="text-sm text-muted-foreground">
                      Audio files are automatically deleted after 30 days for security.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="audioRetention"
                    checked={audioRetention === 'KEEP_FOREVER'}
                    onChange={() => setAudioRetention('KEEP_FOREVER')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">Keep forever</p>
                    <p className="text-sm text-muted-foreground">
                      Audio files are never deleted. Not recommended for privacy.
                    </p>
                  </div>
                </label>
              </div>

              <Button>Save Privacy Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>Download all your data in JSON format</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Download Data Archive</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-destructive/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="outline" className="text-destructive" onClick={handleDeleteAccount}>
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what you want to be notified about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">New pattern detected</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when AI detects a new communication pattern
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Streak reminders</p>
                <p className="text-sm text-muted-foreground">
                  Daily reminder to keep your session streak alive
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Quest completions</p>
                <p className="text-sm text-muted-foreground">
                  Celebrate when you complete a quest or earn a badge
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Relationship health alerts</p>
                <p className="text-sm text-muted-foreground">
                  Alert when relationship health score drops significantly
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Weekly summary</p>
                <p className="text-sm text-muted-foreground">
                  Weekly email with your progress and insights
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <Button>Save Notification Settings</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
