import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class CouplesService {
  constructor(private prisma: PrismaService) {}

  async createCouple(userId: string, name?: string) {
    // Check if user already in a couple
    const existingCouple = await this.prisma.couple.findFirst({
      where: {
        OR: [
          { partner1Id: userId },
          { partner2Id: userId },
        ],
      },
    });

    if (existingCouple) {
      throw new ConflictException('User is already in a couple');
    }

    // Generate unique invite code
    const inviteCode = nanoid(8).toUpperCase();

    const couple = await this.prisma.couple.create({
      data: {
        partner1Id: userId,
        inviteCode,
        name,
      },
      include: {
        partner1: { select: { id: true, name: true, email: true } },
      },
    });

    // Create emotional bank ledger for the couple
    await this.prisma.emotionalBankLedger.create({
      data: {
        coupleId: couple.id,
        balance: 0,
      },
    });

    return couple;
  }

  async joinCouple(userId: string, inviteCode: string) {
    // Check if user already in a couple
    const existingCouple = await this.prisma.couple.findFirst({
      where: {
        OR: [
          { partner1Id: userId },
          { partner2Id: userId },
        ],
      },
    });

    if (existingCouple) {
      throw new ConflictException('User is already in a couple');
    }

    // Find couple by invite code
    const couple = await this.prisma.couple.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!couple) {
      throw new NotFoundException('Invalid invite code');
    }

    if (couple.partner2Id) {
      throw new BadRequestException('Couple already has two partners');
    }

    if (couple.partner1Id === userId) {
      throw new BadRequestException('Cannot join your own couple');
    }

    // Join the couple
    const updatedCouple = await this.prisma.couple.update({
      where: { id: couple.id },
      data: { partner2Id: userId },
      include: {
        partner1: { select: { id: true, name: true, email: true } },
        partner2: { select: { id: true, name: true, email: true } },
      },
    });

    return updatedCouple;
  }

  async findById(coupleId: string) {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      include: {
        partner1: { select: { id: true, name: true, email: true } },
        partner2: { select: { id: true, name: true, email: true } },
        bankLedger: true,
      },
    });

    if (!couple) {
      throw new NotFoundException('Couple not found');
    }

    return couple;
  }

  async getCoupleForUser(userId: string) {
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [
          { partner1Id: userId },
          { partner2Id: userId },
        ],
      },
      include: {
        partner1: { select: { id: true, name: true, email: true } },
        partner2: { select: { id: true, name: true, email: true } },
        bankLedger: true,
      },
    });

    return couple;
  }

  async leaveCouple(userId: string) {
    const couple = await this.getCoupleForUser(userId);

    if (!couple) {
      throw new NotFoundException('Not part of a couple');
    }

    // If user is partner1 and there's no partner2, delete the couple
    if (couple.partner1Id === userId && !couple.partner2Id) {
      await this.prisma.couple.delete({
        where: { id: couple.id },
      });
      return { message: 'Couple deleted' };
    }

    // If user is partner2, remove them
    if (couple.partner2Id === userId) {
      await this.prisma.couple.update({
        where: { id: couple.id },
        data: { partner2Id: null },
      });
      return { message: 'Left the couple' };
    }

    // If user is partner1 and partner2 exists, transfer ownership
    if (couple.partner1Id === userId && couple.partner2Id) {
      await this.prisma.couple.update({
        where: { id: couple.id },
        data: {
          partner1Id: couple.partner2Id,
          partner2Id: null,
        },
      });
      return { message: 'Left the couple' };
    }

    throw new BadRequestException('Unable to leave couple');
  }
}
