# Comprehensive Development Prompt for Scam Dunk: AI-Native Anti-Scam Investment Protection Platform

## 🎯 PROJECT OVERVIEW AND MISSION

You are tasked with building **Scam Dunk**, a world-class, AI-native application that protects investors from sophisticated financial scams, particularly pig-butchering schemes, cryptocurrency fraud, and investment manipulation. This application will save lives and prevent financial devastation for millions of vulnerable people, especially seniors who lose $2.84 billion annually to crypto scams.

### Critical Context
- **Problem Scale**: $1.03 trillion in global scam losses annually, growing 24% year-over-year
- **Target Scams**: Pig-butchering ($12.4B annually), pump-and-dump schemes, fake trading platforms, romance-investment hybrids
- **User Base**: Individual investors, families protecting elderly members, financial advisors, institutions
- **Success Metric**: Detection accuracy >95% with false positive rate <5%

## 📋 CORE REQUIREMENTS AND SPECIFICATIONS

### Platform Architecture Requirements

```yaml
Architecture_Type: Hybrid (Monolithic Core + Microservices)
Deployment: Cloud-Native AWS/GCP
Scalability: 1000+ messages/second throughput
Latency: <100ms for critical alerts, <200ms API responses
Availability: 99.99% uptime SLA
Data_Processing: Real-time stream + batch processing
Security: Bank-grade, SOC 2 Type II compliant
```

### Technical Stack Specifications

```yaml
Frontend:
  Mobile: React Native with Expo
  Web: Next.js 14+ with TypeScript
  Desktop: Electron wrapper for web app
  UI_Framework: Tailwind CSS + shadcn/ui
  State_Management: Zustand + React Query
  Design_System: Apple HIG inspired, WCAG AAA compliant

Backend:
  Core_Service: Node.js with NestJS framework
  API: GraphQL (Apollo Server) + REST fallback
  Database: 
    Primary: PostgreSQL with Prisma ORM
    Cache: Redis
    Vector_DB: Pinecone for embeddings
    Time_Series: TimescaleDB for analytics
  Message_Queue: Apache Kafka
  Search: Elasticsearch

AI_Pipeline:
  Framework: Python FastAPI microservices
  ML_Models:
    - BERT-base fine-tuned for scam detection
    - GPT-4 for content analysis
    - Graph Neural Networks (PyTorch Geometric)
    - Computer Vision (YOLOv8 for screenshot analysis)
  Orchestration: Kubeflow
  Model_Serving: TorchServe + ONNX Runtime

Blockchain:
  Web3_Libraries: ethers.js, web3.py
  Smart_Contract_Analysis: Slither, Mythril
  API_Integrations: Etherscan, BSCScan, CoinGecko

Infrastructure:
  Container: Docker + Kubernetes
  CI_CD: GitHub Actions + ArgoCD
  Monitoring: Prometheus + Grafana + Sentry
  APM: DataDog
  CDN: CloudFlare
```

### Feature Implementation Priority

```markdown
## Phase 1: MVP (Months 1-3)
1. Chat import (WhatsApp, Telegram)
2. Basic scam detection using BERT
3. Risk scoring system
4. Web + iOS app
5. Free tier with 10 scans/month

## Phase 2: Enhanced (Months 4-6)
1. Discord, Instagram integration
2. Real-time monitoring
3. Family accounts
4. Android app
5. Premium subscription tiers

## Phase 3: Enterprise (Months 7-12)
1. API access
2. Bulk scanning
3. Compliance reporting
4. White-label options
5. Advanced AI models
```

## 🏗️ DETAILED IMPLEMENTATION GUIDELINES

### 1. Project Structure and Organization

Create the following directory structure for optimal AI-tool compatibility and human maintainability:

```
scam-dunk/
├── .cursorrules              # AI coding assistant rules
├── .github/
│   ├── workflows/           # CI/CD pipelines
│   └── CODEOWNERS          # Code ownership
├── docs/
│   ├── architecture/
│   │   ├── system.mermaid   # System architecture diagram
│   │   ├── data-flow.md     # Data flow documentation
│   │   └── decisions/       # ADRs (Architecture Decision Records)
│   ├── api/                 # API documentation
│   ├── security/            # Security policies
│   └── compliance/          # Regulatory compliance docs
├── packages/                 # Monorepo structure
│   ├── core/                # Shared business logic
│   ├── web/                 # Next.js web app
│   ├── mobile/              # React Native app
│   ├── api/                 # Backend services
│   ├── ai/                  # AI/ML services
│   └── shared/              # Shared types, utils
├── infrastructure/
│   ├── terraform/           # Infrastructure as Code
│   ├── kubernetes/          # K8s manifests
│   └── docker/              # Dockerfiles
├── scripts/                 # Build, deploy, utility scripts
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── performance/
```

### 2. Core Implementation Tasks

#### Task 2.1: Authentication & User Management

```typescript
// Requirements for auth implementation
interface AuthRequirements {
  methods: ['email', 'social', 'biometric'];
  mfa: true;
  session: {
    type: 'JWT';
    expiry: '7d';
    refresh: true;
  };
  compliance: ['GDPR', 'CCPA', 'APPI'];
}

// Implementation guidelines:
// 1. Use Auth0 or Supabase for authentication
// 2. Implement role-based access control (RBAC)
// 3. Store minimal PII, encrypt at rest
// 4. Implement rate limiting: 10 attempts/hour
// 5. Add device fingerprinting for fraud prevention
```

#### Task 2.2: Chat Import System

```typescript
interface ChatImportSpec {
  platforms: {
    whatsapp: {
      formats: ['.txt', '.zip'];
      parser: 'custom-regex';
      maxSize: '50MB';
    };
    telegram: {
      formats: ['.json'];
      parser: 'json';
      maxSize: '100MB';
    };
    discord: {
      method: 'bot-api';
      permissions: ['READ_MESSAGE_HISTORY'];
    };
    instagram: {
      formats: ['data-download', 'screenshots'];
      ocr: true;
    };
  };
  processing: {
    location: 'client-side-preferred';
    encryption: 'AES-256-GCM';
    retention: '0-days';  // Immediate deletion after processing
  };
}

// Implementation steps:
// 1. Create platform-specific parsers with error recovery
// 2. Implement chunked upload for large files
// 3. Add progress indicators with WebSocket updates
// 4. Sanitize all imported data against XSS/injection
// 5. Create audit log for all imports
```

#### Task 2.3: AI Detection Pipeline

```python
class ScamDetectionPipeline:
    """
    Multi-stage AI pipeline for scam detection
    
    Stage 1: Preprocessing
    - Text normalization
    - Language detection
    - Emoji/emoticon handling
    
    Stage 2: Feature Extraction
    - TF-IDF vectorization
    - Named entity recognition
    - Sentiment analysis
    - Temporal pattern analysis
    
    Stage 3: Model Ensemble
    - BERT for text classification (weight: 0.4)
    - GPT-4 for context understanding (weight: 0.3)
    - GNN for network analysis (weight: 0.2)
    - Rule-based filters (weight: 0.1)
    
    Stage 4: Risk Scoring
    - Weighted ensemble voting
    - Confidence calibration
    - Explainability generation
    
    Performance Requirements:
    - Latency: <500ms per 1000 messages
    - Accuracy: >95% on test set
    - Memory: <2GB per instance
    """
    
    # Implementation guidelines:
    # 1. Use Ray or Celery for distributed processing
    # 2. Implement A/B testing framework for model updates
    # 3. Add drift detection for model performance
    # 4. Create feedback loop for continuous learning
    # 5. Implement explainable AI using SHAP/LIME
```

#### Task 2.4: Blockchain Verification Service

```javascript
class BlockchainVerifier {
  /**
   * Requirements:
   * - Support ETH, BSC, Polygon, Solana
   * - Real-time price feed integration
   * - Smart contract vulnerability scanning
   * - Wallet reputation scoring
   * 
   * Implementation:
   * 1. Use Alchemy/Infura for RPC endpoints
   * 2. Implement retry logic with exponential backoff
   * 3. Cache results in Redis (TTL: 5 minutes)
   * 4. Rate limit: 100 requests/second per chain
   * 5. Implement circuit breaker pattern
   */
  
  async verifyToken(address: string, chain: Chain): Promise<TokenVerification> {
    // Check against known scam databases
    // Analyze smart contract code
    // Check liquidity and holder distribution
    // Calculate risk score
  }
  
  async detectRugPull(contractAddress: string): Promise<RiskAssessment> {
    // Check for honeypot functions
    // Analyze ownership concentration
    // Detect hidden mint functions
    // Check for metamorphic contracts
  }
}
```

### 3. UI/UX Implementation Requirements

#### Design System Specifications

```typescript
// Design tokens following Apple HIG
const designSystem = {
  colors: {
    primary: '#007AFF',     // iOS blue
    danger: '#FF3B30',      // iOS red
    success: '#34C759',     // iOS green
    warning: '#FF9500',     // iOS orange
    background: {
      primary: '#FFFFFF',
      secondary: '#F2F2F7',
      tertiary: '#FFFFFF'
    }
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display"',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '17px',  // iOS default
      lg: '20px',
      xl: '24px',
      '2xl': '28px',
      '3xl': '34px'
    }
  },
  spacing: {
    unit: 4,  // 4px base unit
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]
  },
  accessibility: {
    minTouchTarget: '44px',  // iOS minimum
    focusRingWidth: '3px',
    contrastRatio: 7  // WCAG AAA
  }
};

// Component implementation guidelines:
// 1. All interactive elements must have hover, active, focus states
// 2. Implement skeleton loading for all async content
// 3. Add haptic feedback on mobile for critical actions
// 4. Use React.lazy() for code splitting
// 5. Implement virtual scrolling for long lists
```

#### Senior-Friendly Features

```typescript
interface AccessibilityFeatures {
  visualAids: {
    minimumFontSize: '16px';
    highContrastMode: true;
    largeButtonMode: true;
    reducedMotion: true;
  };
  cognitiveAids: {
    simplifiedMode: true;
    stepByStepGuidance: true;
    voiceControl: true;
    contextualHelp: true;
    undoActions: true;
  };
  safety: {
    confirmationDialogs: true;
    cooldownPeriods: true;  // Prevent panic actions
    familyAlerts: true;
    fraudCoaching: true;  // Educational tooltips
  };
}
```

### 4. Security Implementation

```yaml
Security_Requirements:
  Encryption:
    at_rest: AES-256-GCM
    in_transit: TLS 1.3
    key_management: AWS KMS / HashiCorp Vault
  
  Authentication:
    password_policy:
      min_length: 12
      complexity: true
      history: 5
      expiry: 90_days
    session:
      timeout: 30_minutes
      concurrent_limit: 3
    mfa:
      methods: [TOTP, SMS, WebAuthn]
      required_for: [admin, financial_data_access]
  
  API_Security:
    rate_limiting:
      public: 100/minute
      authenticated: 1000/minute
      premium: 5000/minute
    cors:
      allowed_origins: [specific_domains_only]
    csrf_protection: true
    input_validation: 
      - SQL injection prevention
      - XSS sanitization
      - Command injection prevention
  
  Data_Privacy:
    pii_handling:
      encryption: true
      tokenization: true
      retention: minimal
    gdpr_compliance:
      consent_management: true
      right_to_deletion: true
      data_portability: true
    audit_logging:
      user_actions: true
      data_access: true
      retention: 2_years
```

### 5. Performance Optimization

```javascript
// Performance requirements and implementation
const performanceTargets = {
  web: {
    FCP: '<1.8s',      // First Contentful Paint
    LCP: '<2.5s',      // Largest Contentful Paint
    FID: '<100ms',     // First Input Delay
    CLS: '<0.1',       // Cumulative Layout Shift
    TTI: '<3.8s'       // Time to Interactive
  },
  api: {
    p50: '<50ms',
    p95: '<200ms',
    p99: '<500ms',
    errorRate: '<0.1%'
  },
  mobile: {
    coldStart: '<2s',
    jsBundle: '<500KB',
    memoryCap: '150MB'
  }
};

// Implementation strategies:
// 1. Implement aggressive code splitting
// 2. Use React Server Components where applicable
// 3. Implement Redis caching with smart invalidation
// 4. Use CDN for all static assets
// 5. Implement database query optimization
// 6. Use database connection pooling
// 7. Implement request batching and deduplication
```

## 🧪 TESTING REQUIREMENTS

```yaml
Testing_Strategy:
  Unit_Tests:
    coverage: '>80%'
    frameworks: [Jest, Pytest]
    mocking: true
    
  Integration_Tests:
    coverage: '>70%'
    frameworks: [Supertest, Pytest]
    database: test_containers
    
  E2E_Tests:
    frameworks: [Playwright, Detox]
    browsers: [Chrome, Safari, Firefox]
    mobile: [iOS_Simulator, Android_Emulator]
    
  Performance_Tests:
    tools: [K6, Artillery]
    scenarios:
      - normal_load: 100_users
      - peak_load: 1000_users
      - stress_test: 5000_users
    
  Security_Tests:
    SAST: SonarQube
    DAST: OWASP_ZAP
    dependency_scanning: Snyk
    penetration_testing: quarterly
    
  AI_Model_Tests:
    accuracy_threshold: 0.95
    false_positive_rate: '<0.05'
    adversarial_testing: true
    bias_testing: true
    drift_detection: true
```

## 🚀 DEPLOYMENT AND DEVOPS

```yaml
CI_CD_Pipeline:
  Stages:
    - lint:
        tools: [ESLint, Prettier, Black, isort]
        fail_fast: true
    
    - build:
        parallel: true
        cache: true
        
    - test:
        parallel: true
        coverage_gate: 80%
        
    - security_scan:
        tools: [Snyk, SonarQube]
        block_on_high_severity: true
        
    - deploy:
        environments:
          dev:
            automatic: true
            rollback: automatic
          staging:
            automatic: true
            smoke_tests: true
          production:
            manual_approval: true
            canary_deployment: true
            rollback_threshold: 5%_error_rate

Infrastructure:
  Kubernetes:
    autoscaling:
      min_replicas: 3
      max_replicas: 100
      target_cpu: 70%
    
    health_checks:
      liveness: /health/live
      readiness: /health/ready
      startup: /health/startup
    
    resource_limits:
      cpu: 2000m
      memory: 4Gi
    
  Database:
    replication: master_slave
    backup: daily
    point_in_time_recovery: true
    
  Monitoring:
    metrics: Prometheus
    logs: ELK_Stack
    traces: Jaeger
    alerts: PagerDuty
```

## 📊 QUALITY METRICS AND KPIs

```yaml
Technical_KPIs:
  Availability: '>99.99%'
  Response_Time_P99: '<500ms'
  Error_Rate: '<0.1%'
  Deployment_Frequency: daily
  Lead_Time: '<2_hours'
  MTTR: '<30_minutes'
  Code_Coverage: '>80%'
  Technical_Debt_Ratio: '<5%'
  
Business_KPIs:
  Scam_Detection_Rate: '>95%'
  False_Positive_Rate: '<5%'
  User_Satisfaction: '>4.5/5'
  Time_to_Detection: '<30_seconds'
  Prevention_Success_Rate: '>90%'
  
AI_Performance:
  Model_Accuracy: '>95%'
  Inference_Latency: '<100ms'
  Model_Drift_Detection: weekly
  Retraining_Frequency: monthly
```

## 🎨 CODING STANDARDS AND BEST PRACTICES

### Clean Code Principles

```typescript
/**
 * SOLID Principles:
 * - Single Responsibility: Each class/function does ONE thing
 * - Open/Closed: Open for extension, closed for modification
 * - Liskov Substitution: Derived classes must be substitutable
 * - Interface Segregation: Many specific interfaces > one general
 * - Dependency Inversion: Depend on abstractions, not concretions
 */

// ✅ GOOD: Single responsibility
class ScamDetector {
  detect(message: Message): RiskScore {
    // Only detection logic
  }
}

class ScamReporter {
  report(detection: Detection): void {
    // Only reporting logic
  }
}

// ❌ BAD: Multiple responsibilities
class ScamHandler {
  detectAndReport(message: Message): void {
    // Does too much
  }
}

/**
 * DRY (Don't Repeat Yourself)
 * - Extract common logic into functions
 * - Use configuration over duplication
 * - Create reusable components
 */

/**
 * KISS (Keep It Simple, Stupid)
 * - Avoid clever code
 * - Prioritize readability
 * - Simple > Complex
 */

/**
 * YAGNI (You Aren't Gonna Need It)
 * - Don't add functionality until needed
 * - Avoid premature optimization
 * - Build what's required now
 */
```

### Error Handling

```typescript
// Comprehensive error handling pattern
class ScamDunkError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Usage with proper error boundaries
try {
  const result = await scanMessage(message);
  return { success: true, data: result };
} catch (error) {
  if (error instanceof ScamDunkError && error.isOperational) {
    logger.warn('Operational error', { error });
    return { success: false, error: error.message };
  }
  
  // Unexpected errors
  logger.error('System error', { error });
  await notifyOps(error);
  throw new ScamDunkError(
    'An unexpected error occurred',
    'SYSTEM_ERROR',
    500,
    false
  );
}
```

## 🤖 AI CODING ASSISTANT RULES

```markdown
# .cursorrules file content

You are developing Scam Dunk, a critical financial security application.

## Code Quality Standards
- ALWAYS write TypeScript with strict mode enabled
- NEVER use 'any' type without explicit justification
- ALWAYS include comprehensive error handling
- ALWAYS write unit tests alongside implementation
- ALWAYS document complex logic with clear comments

## Security First
- NEVER log sensitive data (PII, passwords, tokens)
- ALWAYS validate and sanitize user input
- ALWAYS use parameterized queries for database access
- ALWAYS encrypt sensitive data at rest and in transit
- NEVER commit secrets or API keys

## Performance Guidelines
- ALWAYS consider performance implications
- PREFER pagination over loading all data
- USE caching strategically (Redis for hot data)
- IMPLEMENT rate limiting on all endpoints
- OPTIMIZE database queries (use EXPLAIN)

## AI-Specific Guidelines
- BREAK complex tasks into smaller functions
- MAINTAIN single responsibility principle
- PROVIDE clear function/variable names
- INCLUDE type definitions for all parameters
- DOCUMENT expected inputs and outputs

## Testing Requirements
- WRITE tests BEFORE implementation (TDD)
- ACHIEVE minimum 80% code coverage
- INCLUDE edge cases and error scenarios
- TEST security vulnerabilities
- MOCK external dependencies

## Architecture Patterns
- FOLLOW vertical slice architecture for features
- SEPARATE concerns (business logic, data, presentation)
- USE dependency injection
- IMPLEMENT repository pattern for data access
- APPLY CQRS where appropriate
```

## 📝 SUMMARY OF PROMPT EXCELLENCE

### Why This Prompt Creates World-Class Results:

1. **Comprehensive Scope**: Covers all aspects from architecture to deployment, ensuring no critical detail is missed

2. **Specificity with Flexibility**: Provides exact specifications while allowing room for innovation and optimization

3. **Multi-Stakeholder Perspective**: Incorporates insights from UX designers, architects, security experts, and even ex-scammers for authenticity

4. **Performance-First**: Every requirement includes specific performance metrics and optimization strategies

5. **Security-Centric**: Implements bank-grade security from the ground up, not as an afterthought

6. **AI-Optimized Structure**: Uses clear delimiters, structured data, and explicit requirements that AI can parse effectively

7. **Testability Built-In**: Includes comprehensive testing requirements ensuring code quality and reliability

8. **Scalability by Design**: Architecture supports growth from MVP to enterprise without major refactoring

9. **Compliance Ready**: Includes GDPR, CCPA, SOC 2, and financial regulations from the start

10. **Human-Centric**: Despite being AI-native, prioritizes user experience, especially for vulnerable populations

### Key Differentiators:

- **Real-World Problem Solving**: Based on actual scam patterns and prevention needs
- **Measurable Success Criteria**: Every feature has clear KPIs and acceptance criteria
- **Progressive Enhancement**: Phased approach allows for quick MVP and iterative improvement
- **Cross-Platform Excellence**: Unified experience across web, mobile, and desktop
- **Ethical AI Implementation**: Includes bias testing and explainability requirements

This prompt will enable any competent AI coding platform to generate production-ready, secure, scalable code that genuinely protects users from financial devastation while building a sustainable, profitable business.