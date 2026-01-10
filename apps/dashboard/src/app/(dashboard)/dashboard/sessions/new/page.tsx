'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type SessionType = 'audio' | 'whatsapp';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams?.get('type') as SessionType || 'audio';

  const [sessionType, setSessionType] = useState<SessionType>(initialType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (sessionType === 'audio') {
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file');
        return;
      }
    } else {
      if (!file.name.endsWith('.txt')) {
        setError('Please select a WhatsApp chat export (.txt file)');
        return;
      }
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      let session;

      if (sessionType === 'audio') {
        // Create session
        session = await api.createSession();

        // Upload audio
        await api.uploadAudio(session.id, selectedFile);

        // Trigger transcription
        await api.transcribeSession(session.id);
      } else {
        // Import WhatsApp chat
        session = await api.importWhatsAppChat(selectedFile);
      }

      // Redirect to session detail
      router.push(`/dashboard/sessions/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/sessions" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Sessions
        </Link>
        <h1 className="text-3xl font-bold mt-2">Create New Session</h1>
        <p className="text-muted-foreground">Upload an audio recording or import a WhatsApp chat</p>
      </div>

      {/* Session Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Session Type</CardTitle>
          <CardDescription>Choose how you want to create this session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => {
              setSessionType('audio');
              setSelectedFile(null);
              setError(null);
            }}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              sessionType === 'audio'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎙️</span>
              <div>
                <h3 className="font-semibold">Audio Recording</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a pre-recorded audio file of your conversation
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setSessionType('whatsapp');
              setSelectedFile(null);
              setError(null);
            }}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              sessionType === 'whatsapp'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">💬</span>
              <div>
                <h3 className="font-semibold">WhatsApp Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Import an exported WhatsApp conversation (.txt file)
                </p>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            {sessionType === 'audio'
              ? 'Select an audio file (MP3, WAV, M4A, etc.)'
              : 'Select a WhatsApp chat export (.txt file)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload"
              accept={sessionType === 'audio' ? 'audio/*' : '.txt'}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <span className="text-4xl">📁</span>
              <span className="text-sm font-medium">
                {selectedFile ? selectedFile.name : 'Click to select file'}
              </span>
              <span className="text-xs text-muted-foreground">
                {sessionType === 'audio' ? 'Audio files only' : '.txt files only'}
              </span>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-destructive hover:text-destructive/80 text-sm"
                disabled={isUploading}
              >
                Remove
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">📝 Instructions:</p>
            {sessionType === 'audio' ? (
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Record your conversation using your phone or computer</li>
                <li>Save the audio file to your device</li>
                <li>Upload the file here for transcription and analysis</li>
                <li>Processing may take a few minutes depending on file size</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Open WhatsApp on your phone</li>
                <li>Go to the chat you want to export</li>
                <li>Tap the three dots → More → Export chat → Without media</li>
                <li>Save the .txt file and upload it here</li>
              </ul>
            )}
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/sessions" className="flex-1">
              <Button variant="outline" className="w-full" disabled={isUploading}>
                Cancel
              </Button>
            </Link>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              isLoading={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload & Analyze'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
