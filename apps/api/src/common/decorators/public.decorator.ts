import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking routes as public (no authentication required)
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark controller methods as public (bypasses JWT authentication)
 *
 * Usage:
 * @Public()
 * @Get('share/report/:token')
 * async getSharedReport(@Param('token') token: string) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
