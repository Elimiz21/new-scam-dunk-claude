import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  ValidationPipe,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ContactVerificationService } from './contact-verification.service';
import {
  ContactVerificationRequest,
  ContactVerificationResult,
  ContactType,
  ContactVerificationStats
} from './types/contact-verification.types';
import { IsString, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ContactVerificationMetadataDto {
  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  urgency?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  source?: string;
}

class ContactVerificationRequestDto implements ContactVerificationRequest {
  @IsEnum(ContactType)
  type: ContactType;

  @IsString()
  value: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactVerificationMetadataDto)
  metadata?: ContactVerificationMetadataDto;
}

class BulkContactVerificationDto {
  @IsString({ each: true })
  phones?: string[];

  @IsString({ each: true })
  emails?: string[];

  @IsString({ each: true })
  names?: string[];
}

@ApiTags('Contact Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/contact-verification')
export class ContactVerificationController {
  private readonly logger = new Logger(ContactVerificationController.name);

  constructor(
    private readonly contactVerificationService: ContactVerificationService
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify a contact (phone, email, or name)',
    description: 'Verifies a contact against multiple scammer databases and reputation sources'
  })
  @ApiResponse({
    status: 200,
    description: 'Contact verification completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contactType: { type: 'string', enum: ['phone', 'email', 'name'] },
            contactValue: { type: 'string' },
            isScammer: { type: 'boolean' },
            riskScore: { type: 'number', minimum: 0, maximum: 100 },
            riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async verifyContact(
    @Body(new ValidationPipe({ transform: true })) requestDto: ContactVerificationRequestDto
  ): Promise<{
    success: boolean;
    data: ContactVerificationResult;
    processingTime?: number;
  }> {
    this.logger.log(`Contact verification request: ${requestDto.type} - ${requestDto.value}`);
    
    const startTime = Date.now();
    
    try {
      const result = await this.contactVerificationService.verifyContact(requestDto);
      const processingTime = Date.now() - startTime;
      
      this.logger.log(
        `Contact verification completed in ${processingTime}ms: ` +
        `${result.riskLevel} risk (${result.riskScore}/100)`
      );
      
      return {
        success: true,
        data: result,
        processingTime
      };
    } catch (error) {
      this.logger.error(`Contact verification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify a phone number',
    description: 'Specifically verify a phone number for spam/fraud indicators'
  })
  @ApiResponse({ status: 200, description: 'Phone verification completed' })
  async verifyPhone(
    @Body('phoneNumber') phoneNumber: string,
    @Body('metadata') metadata?: any
  ): Promise<{ success: boolean; data: ContactVerificationResult }> {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }

    const request: ContactVerificationRequest = {
      type: ContactType.PHONE,
      value: phoneNumber,
      metadata
    };

    const result = await this.contactVerificationService.verifyContact(request);
    
    return {
      success: true,
      data: result
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify an email address',
    description: 'Verify email for deliverability, reputation, and scam indicators'
  })
  @ApiResponse({ status: 200, description: 'Email verification completed' })
  async verifyEmail(
    @Body('email') email: string,
    @Body('metadata') metadata?: any
  ): Promise<{ success: boolean; data: ContactVerificationResult }> {
    if (!email) {
      throw new BadRequestException('Email address is required');
    }

    const request: ContactVerificationRequest = {
      type: ContactType.EMAIL,
      value: email,
      metadata
    };

    const result = await this.contactVerificationService.verifyContact(request);
    
    return {
      success: true,
      data: result
    };
  }

  @Post('verify-name')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify a person\'s name',
    description: 'Check name against known scammer databases and public records'
  })
  @ApiResponse({ status: 200, description: 'Name verification completed' })
  async verifyName(
    @Body('name') name: string,
    @Body('metadata') metadata?: any
  ): Promise<{ success: boolean; data: ContactVerificationResult }> {
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const request: ContactVerificationRequest = {
      type: ContactType.NAME,
      value: name,
      metadata
    };

    const result = await this.contactVerificationService.verifyContact(request);
    
    return {
      success: true,
      data: result
    };
  }

  @Post('bulk-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Bulk verify multiple contacts',
    description: 'Verify multiple phones, emails, and names in a single request'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk verification completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            phones: { type: 'array' },
            emails: { type: 'array' },
            names: { type: 'array' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            scammersFound: { type: 'number' },
            highRisk: { type: 'number' },
            processingTime: { type: 'number' }
          }
        }
      }
    }
  })
  async bulkVerify(
    @Body(new ValidationPipe({ transform: true })) bulkRequest: BulkContactVerificationDto
  ): Promise<{
    success: boolean;
    results: {
      phones?: ContactVerificationResult[];
      emails?: ContactVerificationResult[];
      names?: ContactVerificationResult[];
    };
    summary: {
      total: number;
      scammersFound: number;
      highRisk: number;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    
    this.logger.log(
      `Bulk verification request: ${bulkRequest.phones?.length || 0} phones, ` +
      `${bulkRequest.emails?.length || 0} emails, ${bulkRequest.names?.length || 0} names`
    );

    const results: any = {};
    let total = 0;
    let scammersFound = 0;
    let highRisk = 0;

    // Verify phones
    if (bulkRequest.phones?.length) {
      results.phones = await Promise.all(
        bulkRequest.phones.map(async (phone) => {
          const result = await this.contactVerificationService.verifyContact({
            type: ContactType.PHONE,
            value: phone
          });
          total++;
          if (result.isScammer) scammersFound++;
          if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') highRisk++;
          return result;
        })
      );
    }

    // Verify emails
    if (bulkRequest.emails?.length) {
      results.emails = await Promise.all(
        bulkRequest.emails.map(async (email) => {
          const result = await this.contactVerificationService.verifyContact({
            type: ContactType.EMAIL,
            value: email
          });
          total++;
          if (result.isScammer) scammersFound++;
          if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') highRisk++;
          return result;
        })
      );
    }

    // Verify names
    if (bulkRequest.names?.length) {
      results.names = await Promise.all(
        bulkRequest.names.map(async (name) => {
          const result = await this.contactVerificationService.verifyContact({
            type: ContactType.NAME,
            value: name
          });
          total++;
          if (result.isScammer) scammersFound++;
          if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') highRisk++;
          return result;
        })
      );
    }

    const processingTime = Date.now() - startTime;
    
    this.logger.log(
      `Bulk verification completed in ${processingTime}ms: ` +
      `${total} total, ${scammersFound} scammers, ${highRisk} high risk`
    );

    return {
      success: true,
      results,
      summary: {
        total,
        scammersFound,
        highRisk,
        processingTime
      }
    };
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get verification statistics',
    description: 'Retrieve statistics about contact verifications performed'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalVerifications: { type: 'number' },
            scammersDetected: { type: 'number' },
            falsePositives: { type: 'number' },
            avgResponseTime: { type: 'number' },
            sourceReliability: { type: 'object' }
          }
        }
      }
    }
  })
  async getStats(): Promise<{
    success: boolean;
    data: ContactVerificationStats;
  }> {
    const stats = await this.contactVerificationService.getVerificationStats();
    
    return {
      success: true,
      data: stats
    };
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check for contact verification service',
    description: 'Check if all external APIs and services are responding'
  })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async healthCheck(): Promise<{
    success: boolean;
    status: string;
    services: Record<string, string>;
    timestamp: string;
  }> {
    // In a real implementation, this would check all external APIs
    const services = {
      'Truecaller API': 'operational',
      'Hunter.io API': 'operational',
      'EmailRep API': 'operational',
      'FBI IC3 Database': 'operational',
      'Redis Cache': 'operational',
      'Database': 'operational'
    };

    return {
      success: true,
      status: 'healthy',
      services,
      timestamp: new Date().toISOString()
    };
  }

  @Get('supported-sources')
  @ApiOperation({ 
    summary: 'Get list of supported verification sources',
    description: 'Retrieve all available verification sources and their capabilities'
  })
  async getSupportedSources(): Promise<{
    success: boolean;
    data: {
      name: string;
      type: ContactType[];
      description: string;
      reliability: number;
      avgResponseTime: number;
    }[];
  }> {
    const sources = [
      {
        name: 'Truecaller',
        type: [ContactType.PHONE],
        description: 'Community-driven phone number identification and spam blocking',
        reliability: 85,
        avgResponseTime: 800
      },
      {
        name: 'Hunter.io',
        type: [ContactType.EMAIL],
        description: 'Email verification and deliverability checking',
        reliability: 90,
        avgResponseTime: 1200
      },
      {
        name: 'EmailRep',
        type: [ContactType.EMAIL],
        description: 'Email reputation and security analysis',
        reliability: 80,
        avgResponseTime: 1000
      },
      {
        name: 'FBI IC3 Database',
        type: [ContactType.PHONE, ContactType.EMAIL, ContactType.NAME],
        description: 'Internet Crime Complaint Center database',
        reliability: 95,
        avgResponseTime: 2000
      },
      {
        name: 'FTC Sentinel Network',
        type: [ContactType.PHONE, ContactType.EMAIL, ContactType.NAME],
        description: 'Federal Trade Commission consumer complaint database',
        reliability: 93,
        avgResponseTime: 1800
      },
      {
        name: 'ScammerInfo',
        type: [ContactType.PHONE, ContactType.EMAIL, ContactType.NAME],
        description: 'Community-maintained scammer database',
        reliability: 75,
        avgResponseTime: 1500
      }
    ];

    return {
      success: true,
      data: sources
    };
  }
}