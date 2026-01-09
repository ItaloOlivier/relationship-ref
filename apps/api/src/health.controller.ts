import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get()
  @ApiExcludeEndpoint()
  root() {
    return {
      name: 'Relationship Referee API',
      version: '0.1.0',
      status: 'running',
      docs: '/api/docs',
      health: '/health',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'relationship-referee-api',
      version: '0.1.0',
    };
  }
}

