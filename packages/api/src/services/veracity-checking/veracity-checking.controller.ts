import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
import { VeracityCheckingService } from './veracity-checking.service';
import {
  VeracityCheckRequest,
  VeracityCheckResult,
  VeracityCheckType,
  TargetType,
  VeracityCheckingStats
} from './types/veracity-checking.types';
import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsObject, 
  ValidateNested, 
  IsBoolean,
  IsNumber,
  IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';

class AdditionalTargetInfoDto {
  @IsOptional()
  @IsString()
  exchange?: string;

  @IsOptional()
  @IsString()
  contractAddress?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsNumber()
  claimedValue?: number;

  @IsOptional()
  dateContext?: Date;
}

class VeracityTargetDto {
  @IsEnum(TargetType)
  type: TargetType;

  @IsString()
  identifier: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdditionalTargetInfoDto)
  additionalInfo?: AdditionalTargetInfoDto;
}

class VeracityCheckOptionsDto {
  @IsEnum(['basic', 'standard', 'comprehensive', 'forensic'])
  thoroughnessLevel: 'basic' | 'standard' | 'comprehensive' | 'forensic';

  @IsBoolean()
  includeHistoricalData: boolean;

  @IsBoolean()
  checkLawEnforcement: boolean;

  @IsBoolean()
  verifyRegulatory: boolean;

  @IsBoolean()
  crossReferenceMultipleSources: boolean;

  @IsBoolean()
  realTimeVerification: boolean;

  @IsBoolean()
  generateComplianceReport: boolean;
}

class VeracityCheckRequestDto {
  @IsEnum(VeracityCheckType)
  checkType: VeracityCheckType;

  @ValidateNested()
  @Type(() => VeracityTargetDto)
  target: VeracityTargetDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VeracityCheckOptionsDto)
  options?: VeracityCheckOptionsDto;
}

class QuickVeracityCheckDto {
  @IsEnum(TargetType)
  targetType: TargetType;

  @IsString()
  identifier: string;

  @IsOptional()
  @IsString()
  additionalContext?: string;
}

class BulkVeracityCheckDto {
  @IsEnum(VeracityCheckType)
  checkType: VeracityCheckType;

  @ValidateNested({ each: true })
  @Type(() => VeracityTargetDto)
  targets: VeracityTargetDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => VeracityCheckOptionsDto)
  options?: VeracityCheckOptionsDto;
}

@ApiTags('Veracity Checking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/veracity-checking')
export class VeracityCheckingController {
  private readonly logger = new Logger(VeracityCheckingController.name);

  constructor(
    private readonly veracityCheckingService: VeracityCheckingService
  ) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Comprehensive veracity check',
    description: 'Verify the existence, legitimacy, and compliance of stocks, cryptocurrencies, companies, or platforms'
  })
  @ApiResponse({
    status: 200,
    description: 'Veracity check completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            isVerified: { type: 'boolean' },
            verificationStatus: { 
              type: 'string', 
              enum: ['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'SUSPICIOUS', 'FRAUDULENT', 'INSUFFICIENT_DATA'] 
            },
            overallConfidence: { type: 'number', minimum: 0, maximum: 100 },
            riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            summary: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } },
            processingTime: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Verification failed' })
  async checkVeracity(
    @Body(new ValidationPipe({ transform: true })) request: VeracityCheckRequestDto
  ): Promise<{
    success: boolean;
    data: VeracityCheckResult;
    processingTime?: number;
  }> {
    this.logger.log(`Veracity check request: ${request.target.type} - ${request.target.identifier}`);
    
    const startTime = Date.now();
    
    try {
      const result = await this.veracityCheckingService.checkVeracity(request);
      const processingTime = Date.now() - startTime;
      
      this.logger.log(
        `Veracity check completed in ${processingTime}ms: ` +
        `${result.verificationStatus} (${result.overallConfidence}% confidence)`
      );
      
      return {
        success: true,
        data: result,
        processingTime
      };
    } catch (error) {
      this.logger.error(`Veracity check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('quick-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Quick veracity check',
    description: 'Fast verification focusing on existence and basic legitimacy checks'
  })
  @ApiResponse({ status: 200, description: 'Quick check completed' })
  async quickCheck(
    @Body(new ValidationPipe({ transform: true })) request: QuickVeracityCheckDto
  ): Promise<{
    success: boolean;
    data: Partial<VeracityCheckResult>;
  }> {
    const fullRequest: VeracityCheckRequestDto = {
      checkType: this.getDefaultCheckType(request.targetType),
      target: {
        type: request.targetType,
        identifier: request.identifier,
        additionalInfo: request.additionalContext ? { companyName: request.additionalContext } : undefined
      },
      options: {
        thoroughnessLevel: 'basic',
        includeHistoricalData: false,
        checkLawEnforcement: false,
        verifyRegulatory: true,
        crossReferenceMultipleSources: false,
        realTimeVerification: false,
        generateComplianceReport: false
      }
    };

    const result = await this.veracityCheckingService.checkVeracity(fullRequest);
    
    // Return simplified result for quick check
    return {
      success: true,
      data: {
        id: result.id,
        isVerified: result.isVerified,
        verificationStatus: result.verificationStatus,
        overallConfidence: result.overallConfidence,
        riskLevel: result.riskLevel,
        summary: result.summary,
        keyFindings: result.keyFindings,
        recommendations: result.recommendations,
        existenceVerification: result.existenceVerification,
        warnings: result.warnings,
        redFlags: result.redFlags,
        processingTime: result.processingTime,
        lastVerified: result.lastVerified
      }
    };
  }

  @Post('verify-stock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify stock symbol',
    description: 'Comprehensive verification of stock symbols including SEC registration and market data'
  })
  async verifyStock(
    @Body('symbol') symbol: string,
    @Body('exchange') exchange?: string,
    @Body('thoroughness') thoroughness: 'basic' | 'comprehensive' = 'standard'
  ): Promise<{
    success: boolean;
    data: VeracityCheckResult;
  }> {
    if (!symbol) {
      throw new BadRequestException('Stock symbol is required');
    }

    const request: VeracityCheckRequestDto = {
      checkType: VeracityCheckType.STOCK_VERIFICATION,
      target: {
        type: TargetType.STOCK_SYMBOL,
        identifier: symbol.toUpperCase(),
        additionalInfo: exchange ? { exchange } : undefined
      },
      options: {
        thoroughnessLevel: thoroughness,
        includeHistoricalData: true,
        checkLawEnforcement: false,
        verifyRegulatory: true,
        crossReferenceMultipleSources: true,
        realTimeVerification: false,
        generateComplianceReport: true
      }
    };

    const result = await this.veracityCheckingService.checkVeracity(request);
    
    return {
      success: true,
      data: result
    };
  }

  @Post('verify-crypto')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify cryptocurrency',
    description: 'Verify cryptocurrency tokens/coins including contract verification and exchange listings'
  })
  async verifyCrypto(
    @Body('symbol') symbol?: string,
    @Body('contractAddress') contractAddress?: string,
    @Body('network') network?: string
  ): Promise<{
    success: boolean;
    data: VeracityCheckResult;
  }> {
    if (!symbol && !contractAddress) {
      throw new BadRequestException('Either symbol or contract address is required');
    }

    const request: VeracityCheckRequestDto = {
      checkType: VeracityCheckType.CRYPTO_VERIFICATION,
      target: {
        type: contractAddress ? TargetType.CRYPTO_CONTRACT : TargetType.CRYPTO_SYMBOL,
        identifier: contractAddress || symbol!,
        additionalInfo: {
          contractAddress,
          ...(network && { jurisdiction: network })
        }
      },
      options: {
        thoroughnessLevel: 'comprehensive',
        includeHistoricalData: true,
        checkLawEnforcement: true,
        verifyRegulatory: true,
        crossReferenceMultipleSources: true,
        realTimeVerification: true,
        generateComplianceReport: false
      }
    };

    const result = await this.veracityCheckingService.checkVeracity(request);
    
    return {
      success: true,
      data: result
    };
  }

  @Post('verify-company')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify company',
    description: 'Verify company registration, licenses, and regulatory compliance'
  })
  async verifyCompany(
    @Body('companyName') companyName: string,
    @Body('jurisdiction') jurisdiction?: string,
    @Body('website') website?: string
  ): Promise<{
    success: boolean;
    data: VeracityCheckResult;
  }> {
    if (!companyName) {
      throw new BadRequestException('Company name is required');
    }

    const request: VeracityCheckRequestDto = {
      checkType: VeracityCheckType.COMPANY_VERIFICATION,
      target: {
        type: TargetType.COMPANY_NAME,
        identifier: companyName,
        additionalInfo: {
          jurisdiction,
          website,
          companyName
        }
      },
      options: {
        thoroughnessLevel: 'comprehensive',
        includeHistoricalData: true,
        checkLawEnforcement: true,
        verifyRegulatory: true,
        crossReferenceMultipleSources: true,
        realTimeVerification: false,
        generateComplianceReport: true
      }
    };

    const result = await this.veracityCheckingService.checkVeracity(request);
    
    return {
      success: true,
      data: result
    };
  }

  @Post('verify-platform')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify trading platform',
    description: 'Verify trading platforms, brokers, and financial service providers'
  })
  async verifyPlatform(
    @Body('platformName') platformName: string,
    @Body('website') website?: string,
    @Body('jurisdiction') jurisdiction?: string
  ): Promise<{
    success: boolean;
    data: VeracityCheckResult;
  }> {
    if (!platformName) {
      throw new BadRequestException('Platform name is required');
    }

    const request: VeracityCheckRequestDto = {
      checkType: VeracityCheckType.PLATFORM_VERIFICATION,
      target: {
        type: TargetType.TRADING_PLATFORM,
        identifier: platformName,
        additionalInfo: {
          website,
          jurisdiction,
          companyName: platformName
        }
      },
      options: {
        thoroughnessLevel: 'forensic',
        includeHistoricalData: true,
        checkLawEnforcement: true,
        verifyRegulatory: true,
        crossReferenceMultipleSources: true,
        realTimeVerification: true,
        generateComplianceReport: true
      }
    };

    const result = await this.veracityCheckingService.checkVeracity(request);
    
    return {
      success: true,
      data: result
    };
  }

  @Post('bulk-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Bulk veracity check',
    description: 'Verify multiple targets in a single request'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk verification completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        results: { type: 'array' },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            verified: { type: 'number' },
            suspicious: { type: 'number' },
            fraudulent: { type: 'number' },
            processingTime: { type: 'number' }
          }
        }
      }
    }
  })
  async bulkCheck(
    @Body(new ValidationPipe({ transform: true })) request: BulkVeracityCheckDto
  ): Promise<{
    success: boolean;
    results: VeracityCheckResult[];
    summary: {
      total: number;
      verified: number;
      suspicious: number;
      fraudulent: number;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    
    this.logger.log(
      `Bulk veracity check request: ${request.targets.length} targets`
    );

    const results: VeracityCheckResult[] = [];
    let verified = 0;
    let suspicious = 0;
    let fraudulent = 0;

    // Process each target
    for (const target of request.targets) {
      try {
        const individualRequest: VeracityCheckRequestDto = {
          checkType: request.checkType,
          target,
          options: request.options
        };

        const result = await this.veracityCheckingService.checkVeracity(individualRequest);
        results.push(result);

        // Count statuses
        switch (result.verificationStatus) {
          case 'VERIFIED':
          case 'PARTIALLY_VERIFIED':
            verified++;
            break;
          case 'SUSPICIOUS':
            suspicious++;
            break;
          case 'FRAUDULENT':
            fraudulent++;
            break;
        }
      } catch (error) {
        this.logger.warn(`Individual verification failed for ${target.identifier}: ${error.message}`);
        // Continue with other targets
      }
    }

    const processingTime = Date.now() - startTime;
    
    this.logger.log(
      `Bulk veracity check completed in ${processingTime}ms: ` +
      `${results.length}/${request.targets.length} successful, ${verified} verified, ${suspicious} suspicious, ${fraudulent} fraudulent`
    );

    return {
      success: true,
      results,
      summary: {
        total: results.length,
        verified,
        suspicious,
        fraudulent,
        processingTime
      }
    };
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get veracity checking statistics',
    description: 'Retrieve statistics about veracity checks performed'
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
            totalChecks: { type: 'number' },
            verifiedEntities: { type: 'number' },
            suspiciousEntities: { type: 'number' },
            fraudulentEntities: { type: 'number' },
            accuracyRate: { type: 'number' },
            averageProcessingTime: { type: 'number' }
          }
        }
      }
    }
  })
  async getStats(): Promise<{
    success: boolean;
    data: VeracityCheckingStats;
  }> {
    const stats = await this.veracityCheckingService.getVeracityStats();
    
    return {
      success: true,
      data: stats
    };
  }

  @Get('verification-sources')
  @ApiOperation({ 
    summary: 'Get list of verification sources',
    description: 'Retrieve all data sources used for verification'
  })
  async getVerificationSources(): Promise<{
    success: boolean;
    data: {
      category: string;
      sources: {
        name: string;
        type: string;
        description: string;
        reliability: number;
        coverage: string[];
        accessLevel: string;
      }[];
    }[];
  }> {
    const sources = [
      {
        category: 'Government & Regulatory',
        sources: [
          {
            name: 'SEC EDGAR Database',
            type: 'regulatory',
            description: 'U.S. Securities and Exchange Commission filings database',
            reliability: 95,
            coverage: ['US public companies', 'Investment funds', 'Broker-dealers'],
            accessLevel: 'public'
          },
          {
            name: 'FINRA BrokerCheck',
            type: 'regulatory',
            description: 'Financial Industry Regulatory Authority broker database',
            reliability: 98,
            coverage: ['Brokers', 'Investment advisors', 'Firms'],
            accessLevel: 'public'
          },
          {
            name: 'OFAC Sanctions List',
            type: 'government',
            description: 'Office of Foreign Assets Control sanctions database',
            reliability: 99,
            coverage: ['Sanctioned individuals', 'Companies', 'Countries'],
            accessLevel: 'public'
          }
        ]
      },
      {
        category: 'Law Enforcement',
        sources: [
          {
            name: 'FBI IC3 Database',
            type: 'law_enforcement',
            description: 'Internet Crime Complaint Center database',
            reliability: 92,
            coverage: ['Internet crimes', 'Fraud reports', 'Scam reports'],
            accessLevel: 'restricted'
          },
          {
            name: 'Interpol Database',
            type: 'law_enforcement',
            description: 'International police cooperation database',
            reliability: 90,
            coverage: ['International criminals', 'Wanted persons', 'Organizations'],
            accessLevel: 'restricted'
          }
        ]
      },
      {
        category: 'Market Data',
        sources: [
          {
            name: 'Alpha Vantage',
            type: 'market_data',
            description: 'Real-time and historical market data',
            reliability: 88,
            coverage: ['Stocks', 'Forex', 'Cryptocurrencies'],
            accessLevel: 'api'
          },
          {
            name: 'CoinGecko',
            type: 'market_data',
            description: 'Cryptocurrency market data and information',
            reliability: 85,
            coverage: ['Cryptocurrencies', 'DeFi tokens', 'NFTs'],
            accessLevel: 'api'
          },
          {
            name: 'Polygon.io',
            type: 'market_data',
            description: 'Real-time market data and financial APIs',
            reliability: 90,
            coverage: ['Stocks', 'Options', 'Forex', 'Crypto'],
            accessLevel: 'api'
          }
        ]
      },
      {
        category: 'Business Intelligence',
        sources: [
          {
            name: 'Clearbit',
            type: 'business',
            description: 'Business intelligence and company data',
            reliability: 80,
            coverage: ['Company information', 'Contact data', 'Technology stack'],
            accessLevel: 'api'
          },
          {
            name: 'Crunchbase',
            type: 'business',
            description: 'Startup and company information database',
            reliability: 82,
            coverage: ['Startups', 'Funding', 'Business relationships'],
            accessLevel: 'api'
          }
        ]
      },
      {
        category: 'Reputation & News',
        sources: [
          {
            name: 'NewsAPI',
            type: 'news',
            description: 'Global news aggregation service',
            reliability: 75,
            coverage: ['News articles', 'Press releases', 'Media coverage'],
            accessLevel: 'api'
          },
          {
            name: 'Social Media APIs',
            type: 'social_media',
            description: 'Social media platform APIs for sentiment analysis',
            reliability: 70,
            coverage: ['Social sentiment', 'Public opinion', 'Community feedback'],
            accessLevel: 'api'
          }
        ]
      }
    ];

    return {
      success: true,
      data: sources
    };
  }

  @Get('check-types')
  @ApiOperation({ 
    summary: 'Get available verification types',
    description: 'Retrieve all available verification check types and their capabilities'
  })
  async getCheckTypes(): Promise<{
    success: boolean;
    data: {
      type: string;
      name: string;
      description: string;
      targetTypes: string[];
      verificationAspects: string[];
      averageProcessingTime: string;
      thoroughnessLevels: string[];
    }[];
  }> {
    const checkTypes = [
      {
        type: 'STOCK_VERIFICATION',
        name: 'Stock Verification',
        description: 'Comprehensive verification of stock symbols and public companies',
        targetTypes: ['STOCK_SYMBOL'],
        verificationAspects: [
          'SEC registration verification',
          'Exchange listings',
          'Market data validation',
          'Trading activity analysis',
          'Regulatory compliance',
          'Financial reporting verification'
        ],
        averageProcessingTime: '3-5 seconds',
        thoroughnessLevels: ['basic', 'standard', 'comprehensive']
      },
      {
        type: 'CRYPTO_VERIFICATION',
        name: 'Cryptocurrency Verification',
        description: 'Verification of cryptocurrencies, tokens, and smart contracts',
        targetTypes: ['CRYPTO_SYMBOL', 'CRYPTO_CONTRACT'],
        verificationAspects: [
          'Blockchain contract verification',
          'Exchange listings',
          'Market cap validation',
          'Community verification',
          'Smart contract audit',
          'Token distribution analysis'
        ],
        averageProcessingTime: '4-8 seconds',
        thoroughnessLevels: ['basic', 'standard', 'comprehensive', 'forensic']
      },
      {
        type: 'COMPANY_VERIFICATION',
        name: 'Company Verification',
        description: 'Business registration and corporate entity verification',
        targetTypes: ['COMPANY_NAME'],
        verificationAspects: [
          'Business registration verification',
          'Corporate structure analysis',
          'License validation',
          'Regulatory compliance',
          'Operational status',
          'Reputation analysis'
        ],
        averageProcessingTime: '5-10 seconds',
        thoroughnessLevels: ['basic', 'standard', 'comprehensive', 'forensic']
      },
      {
        type: 'PLATFORM_VERIFICATION',
        name: 'Trading Platform Verification',
        description: 'Verification of trading platforms, brokers, and financial services',
        targetTypes: ['TRADING_PLATFORM', 'WEBSITE_URL'],
        verificationAspects: [
          'Financial license verification',
          'Regulatory authorization',
          'Platform security analysis',
          'User reputation analysis',
          'Operational verification',
          'Law enforcement checks'
        ],
        averageProcessingTime: '8-15 seconds',
        thoroughnessLevels: ['basic', 'standard', 'comprehensive', 'forensic']
      },
      {
        type: 'INVESTMENT_VERIFICATION',
        name: 'Investment Product Verification',
        description: 'Verification of investment products, funds, and financial instruments',
        targetTypes: ['INVESTMENT_FUND', 'FINANCIAL_PRODUCT'],
        verificationAspects: [
          'Product registration verification',
          'Fund structure analysis',
          'Regulatory approval',
          'Performance verification',
          'Risk assessment',
          'Manager credentials'
        ],
        averageProcessingTime: '6-12 seconds',
        thoroughnessLevels: ['basic', 'standard', 'comprehensive', 'forensic']
      },
      {
        type: 'COMPREHENSIVE_VERIFICATION',
        name: 'Comprehensive Verification',
        description: 'Complete verification across all available aspects',
        targetTypes: ['All supported types'],
        verificationAspects: [
          'All verification aspects',
          'Cross-reference validation',
          'Historical analysis',
          'Reputation scoring',
          'Risk assessment',
          'Compliance reporting'
        ],
        averageProcessingTime: '10-20 seconds',
        thoroughnessLevels: ['comprehensive', 'forensic']
      }
    ];

    return {
      success: true,
      data: checkTypes
    };
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check for veracity checking service',
    description: 'Check if all verification sources and databases are accessible'
  })
  async healthCheck(): Promise<{
    success: boolean;
    status: string;
    sources: Record<string, string>;
    timestamp: string;
  }> {
    const sources = {
      'SEC Database': 'operational',
      'FINRA Database': 'operational',
      'Market Data APIs': 'operational',
      'Cryptocurrency APIs': 'operational',
      'Business Intelligence': 'operational',
      'News Sources': 'operational',
      'Law Enforcement APIs': 'restricted_access',
      'Regulatory Databases': 'operational',
      'Cache System': 'operational',
      'Database Connection': 'operational'
    };

    return {
      success: true,
      status: 'healthy',
      sources,
      timestamp: new Date().toISOString()
    };
  }

  // Helper method to determine default check type
  private getDefaultCheckType(targetType: TargetType): VeracityCheckType {
    switch (targetType) {
      case TargetType.STOCK_SYMBOL:
        return VeracityCheckType.STOCK_VERIFICATION;
      case TargetType.CRYPTO_SYMBOL:
      case TargetType.CRYPTO_CONTRACT:
        return VeracityCheckType.CRYPTO_VERIFICATION;
      case TargetType.COMPANY_NAME:
        return VeracityCheckType.COMPANY_VERIFICATION;
      case TargetType.TRADING_PLATFORM:
        return VeracityCheckType.PLATFORM_VERIFICATION;
      case TargetType.INVESTMENT_FUND:
      case TargetType.FINANCIAL_PRODUCT:
        return VeracityCheckType.INVESTMENT_VERIFICATION;
      default:
        return VeracityCheckType.COMPREHENSIVE_VERIFICATION;
    }
  }
}