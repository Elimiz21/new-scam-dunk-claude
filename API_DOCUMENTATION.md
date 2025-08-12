# 📚 Scam Dunk API Documentation

## Overview

The Scam Dunk API provides comprehensive endpoints for scam detection, chat analysis, blockchain verification, and user management. The API supports both REST and GraphQL interfaces, with WebSocket support for real-time updates.

## Base URLs

- **Production**: `https://api.scamdunk.com`
- **Staging**: `https://staging-api.scamdunk.com`
- **Development**: `http://localhost:4000`

## Authentication

All API requests require authentication using JWT tokens.

### Obtaining Tokens

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Using Tokens

Include the access token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## REST API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "acceptTerms": true
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful",
  "userId": "uuid"
}
```

#### Login
```http
POST /api/auth/login
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```http
POST /api/auth/logout
```

#### Forgot Password
```http
POST /api/auth/forgot-password
```

#### Reset Password
```http
POST /api/auth/reset-password
```

### Scans

#### Create Scan
```http
POST /api/scans/create
```

**Request Body:**
```json
{
  "type": "text",
  "content": "Guaranteed 500% returns! Send BTC now!",
  "metadata": {
    "source": "whatsapp",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

**Response:** `201 Created`
```json
{
  "scanId": "uuid",
  "status": "processing",
  "estimatedTime": 30
}
```

#### Get Scan Status
```http
GET /api/scans/:scanId
```

**Response:** `200 OK`
```json
{
  "scanId": "uuid",
  "status": "completed",
  "riskScore": 89,
  "riskLevel": "high",
  "threats": [
    {
      "type": "investment_scam",
      "confidence": 0.95,
      "evidence": ["guaranteed returns", "send BTC"]
    }
  ],
  "recommendations": [
    "Do not engage with this message",
    "Report to authorities"
  ]
}
```

#### Get Scan History
```http
GET /api/scans/history
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status
- `riskLevel` (string): Filter by risk level
- `startDate` (string): ISO date
- `endDate` (string): ISO date

### Chat Import

#### Initialize Upload
```http
POST /api/chat-import/initialize
```

**Request Body:**
```json
{
  "fileName": "whatsapp_export.txt",
  "fileSize": 5242880,
  "platform": "whatsapp",
  "totalChunks": 5
}
```

**Response:** `200 OK`
```json
{
  "uploadId": "uuid",
  "chunkSize": 1048576,
  "uploadUrl": "/api/chat-import/upload-chunk"
}
```

#### Upload Chunk
```http
POST /api/chat-import/upload-chunk/:uploadId/:chunkIndex
```

**Request:** Multipart form data with file chunk

**Response:** `200 OK`
```json
{
  "chunkIndex": 0,
  "received": true,
  "progress": 20
}
```

#### Finalize Upload
```http
POST /api/chat-import/finalize
```

**Request Body:**
```json
{
  "uploadId": "uuid"
}
```

#### Get Import Status
```http
GET /api/chat-import/status/:importId
```

#### Get Import Results
```http
GET /api/chat-import/results/:importId
```

**Response:** `200 OK`
```json
{
  "importId": "uuid",
  "status": "completed",
  "platform": "whatsapp",
  "statistics": {
    "totalMessages": 1234,
    "totalParticipants": 5,
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  },
  "riskAssessment": {
    "overallRisk": 75,
    "riskLevel": "high",
    "suspiciousMessages": 45,
    "highRiskParticipants": 2
  },
  "keyFindings": [
    {
      "type": "crypto_scam",
      "severity": "critical",
      "evidence": ["..."],
      "recommendations": ["..."]
    }
  ]
}
```

### Blockchain Verification

#### Verify Token
```http
POST /api/blockchain/verify/token
```

**Request Body:**
```json
{
  "address": "0x1234567890abcdef...",
  "network": "ethereum"
}
```

**Response:** `200 OK`
```json
{
  "address": "0x1234...",
  "network": "ethereum",
  "verification": {
    "isVerified": true,
    "riskScore": 45,
    "riskLevel": "medium",
    "flags": ["low_liquidity", "high_concentration"]
  },
  "tokenInfo": {
    "name": "Token Name",
    "symbol": "TKN",
    "totalSupply": "1000000000",
    "holders": 1234,
    "liquidity": "$100,000"
  }
}
```

#### Check Wallet
```http
POST /api/blockchain/verify/wallet
```

**Request Body:**
```json
{
  "address": "0xabcdef1234567890...",
  "network": "ethereum"
}
```

#### Detect Rug Pull
```http
POST /api/blockchain/detect/rugpull
```

**Request Body:**
```json
{
  "contractAddress": "0x1234...",
  "network": "bsc"
}
```

### AI Analysis

#### Analyze Text
```http
POST /api/ai/analyze/text
```

**Request Body:**
```json
{
  "text": "Investment opportunity with guaranteed returns",
  "includeExplanation": true
}
```

**Response:** `200 OK`
```json
{
  "riskScore": 0.89,
  "riskLevel": "high",
  "confidence": 0.92,
  "categories": ["investment_scam", "urgency_tactics"],
  "explanation": "High risk indicators detected...",
  "evidence": [
    {
      "text": "guaranteed returns",
      "type": "suspicious_phrase",
      "severity": "high"
    }
  ]
}
```

#### Analyze Conversation
```http
POST /api/ai/analyze/conversation
```

**Request Body:**
```json
{
  "messages": [
    {
      "text": "Hello, I have an investment opportunity",
      "timestamp": "2024-01-01T10:00:00Z",
      "sender": "unknown"
    },
    {
      "text": "What kind of returns?",
      "timestamp": "2024-01-01T10:01:00Z",
      "sender": "user"
    }
  ]
}
```

### User Management

#### Get Profile
```http
GET /api/users/profile
```

#### Update Profile
```http
PUT /api/users/profile
```

#### Change Password
```http
POST /api/users/change-password
```

#### Enable 2FA
```http
POST /api/users/2fa/enable
```

#### Add Family Member
```http
POST /api/users/family/add
```

## GraphQL API

### Endpoint
```
POST /graphql
```

### Schema

```graphql
type Query {
  # User queries
  me: User
  user(id: ID!): User
  
  # Scan queries
  scan(id: ID!): Scan
  scans(filter: ScanFilter, pagination: Pagination): ScanConnection
  
  # Chat import queries
  chatImport(id: ID!): ChatImport
  chatImports(filter: ChatImportFilter): [ChatImport]
  
  # Statistics
  statistics(timeRange: TimeRange): Statistics
}

type Mutation {
  # Authentication
  login(email: String!, password: String!): AuthPayload
  register(input: RegisterInput!): User
  refreshToken(token: String!): AuthPayload
  
  # Scans
  createScan(input: CreateScanInput!): Scan
  deleteScan(id: ID!): Boolean
  
  # Chat imports
  initiateChatImport(input: ChatImportInput!): ChatImport
  
  # User management
  updateProfile(input: UpdateProfileInput!): User
  changePassword(oldPassword: String!, newPassword: String!): Boolean
}

type Subscription {
  scanProgress(scanId: ID!): ScanProgress
  scanComplete(scanId: ID!): Scan
  alertCreated: Alert
}
```

### Example Queries

#### Get Scan Details
```graphql
query GetScan($id: ID!) {
  scan(id: $id) {
    id
    status
    riskScore
    riskLevel
    createdAt
    analysis {
      threats {
        type
        confidence
        evidence
      }
      recommendations
    }
    user {
      id
      email
    }
  }
}
```

#### Create Scan
```graphql
mutation CreateScan($input: CreateScanInput!) {
  createScan(input: $input) {
    id
    status
    estimatedTime
  }
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Scan Events
```javascript
// Subscribe to scan progress
socket.emit('subscribe:scan', { scanId: 'uuid' });

// Receive progress updates
socket.on('scan:progress', (data) => {
  console.log(`Progress: ${data.percentage}%`);
});

// Scan completed
socket.on('scan:complete', (result) => {
  console.log('Scan complete:', result);
});
```

#### Chat Import Events
```javascript
// Subscribe to import progress
socket.emit('subscribe:import', { importId: 'uuid' });

// Progress updates
socket.on('import:progress', (data) => {
  console.log(`Processing: ${data.processed}/${data.total}`);
});

// Import complete
socket.on('import:complete', (result) => {
  console.log('Import complete:', result);
});
```

#### Real-time Alerts
```javascript
// Subscribe to alerts
socket.emit('subscribe:alerts');

// Receive alerts
socket.on('alert:new', (alert) => {
  console.log('New alert:', alert);
});
```

## Error Responses

### Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **Premium**: 1000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

Standard pagination parameters:
- `page`: Page number (starts at 1)
- `limit`: Items per page (max 100)
- `sort`: Sort field
- `order`: Sort order (asc/desc)

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhooks

Configure webhooks to receive real-time notifications:

```http
POST /api/webhooks/configure
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["scan.complete", "alert.created"],
  "secret": "webhook_secret"
}
```

## SDKs

Official SDKs available:
- JavaScript/TypeScript: `npm install @scamdunk/sdk`
- Python: `pip install scamdunk`
- Go: `go get github.com/scamdunk/go-sdk`

## Support

- API Status: https://status.scamdunk.com
- Support: api-support@scamdunk.com
- Documentation: https://docs.scamdunk.com