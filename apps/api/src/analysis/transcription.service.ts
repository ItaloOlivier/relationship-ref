import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TranscriptionService {
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'sk-your-openai-api-key') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async transcribeAudio(audioPath: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }
    const audioFile = fs.createReadStream(audioPath);

    const response = await this.openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
      language: 'en',
    });

    return response;
  }

  async transcribeFromBuffer(buffer: Buffer, filename: string): Promise<string> {
    // Create a temporary file
    const tempPath = path.join('/tmp', `${Date.now()}-${filename}`);
    fs.writeFileSync(tempPath, buffer);

    try {
      const transcript = await this.transcribeAudio(tempPath);
      return transcript;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  async transcribeFromUrl(audioUrl: string): Promise<string> {
    // Fetch the audio file
    const response = await fetch(audioUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = audioUrl.split('/').pop() || 'audio.mp3';

    return this.transcribeFromBuffer(buffer, filename);
  }
}
