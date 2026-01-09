import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async requestMagicLink(email: string): Promise<{ message: string }> {
    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email },
      });
    }

    // Generate magic link token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.magicLink.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // In production, send email here
    // For MVP/dev, log the token
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const magicLinkUrl = `${appUrl}/auth/verify?token=${token}`;

    console.log(`Magic link for ${email}: ${magicLinkUrl}`);

    // TODO: Integrate email service (nodemailer)

    return {
      message: 'Magic link sent to your email',
    };
  }

  async verifyMagicLink(token: string): Promise<{ accessToken: string; user: any }> {
    const magicLink = await this.prisma.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      throw new UnauthorizedException('Invalid magic link');
    }

    if (magicLink.usedAt) {
      throw new UnauthorizedException('Magic link already used');
    }

    if (magicLink.expiresAt < new Date()) {
      throw new UnauthorizedException('Magic link expired');
    }

    // Mark as used
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    // Generate JWT
    const payload = { sub: magicLink.user.id, email: magicLink.user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: magicLink.user.id,
        email: magicLink.user.email,
        name: magicLink.user.name,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async demoLogin(): Promise<{ accessToken: string; user: any }> {
    const demoEmail = 'demo@relationshipreferee.app';

    // Find or create demo user
    let user = await this.prisma.user.findUnique({ where: { email: demoEmail } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: demoEmail,
          name: 'Demo User',
        },
      });
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
