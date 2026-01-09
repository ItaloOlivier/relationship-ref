import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        coupleAsPartner1: true,
        coupleAsPartner2: true,
        streaks: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    // This will cascade delete related data due to Prisma schema
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Account deleted successfully' };
  }

  async getCouple(userId: string) {
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
      },
    });

    return couple;
  }
}
