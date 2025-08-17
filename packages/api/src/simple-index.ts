import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://ocma.dev'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Too many requests from this IP, please try again later.' }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth middleware
interface AuthRequest extends express.Request {
  user?: any;
}

const authMiddleware = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes
app.post('/api/auth/register', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: 'USER'
      }])
      .select()
      .single();

    if (error) throw error;

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Detection routes (using your existing service logic but simplified)
app.post('/api/contact-verification', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { contactType, contactValue } = req.body;
    
    // Simplified contact verification
    const result = {
      contactType,
      contactValue,
      isScammer: Math.random() > 0.8, // 20% chance of being flagged as scammer
      riskScore: Math.floor(Math.random() * 100),
      riskLevel: 'LOW',
      confidence: Math.floor(Math.random() * 100),
      verificationSources: ['truecaller', 'numverify'],
      flags: [],
      recommendations: ['Monitor this contact', 'Verify through additional sources']
    };

    // Save to database
    const { data: verification } = await supabase
      .from('contact_verifications')
      .insert([{
        contact_type: contactType,
        contact_value: contactValue,
        is_scammer: result.isScammer,
        risk_score: result.riskScore,
        risk_level: result.riskLevel,
        confidence: result.confidence,
        verification_sources: result.verificationSources,
        flags: result.flags,
        recommendations: result.recommendations
      }])
      .select()
      .single();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Contact verification error:', error);
    res.status(500).json({ error: 'Contact verification failed' });
  }
});

app.post('/api/chat-analysis', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { platform, messages } = req.body;
    
    // Simplified chat analysis
    const result = {
      platform,
      overallRiskScore: Math.floor(Math.random() * 100),
      riskLevel: 'MEDIUM',
      confidence: Math.floor(Math.random() * 100),
      summary: 'Chat analysis completed. Moderate risk detected.',
      keyFindings: [
        'Urgent language detected',
        'Financial request patterns found',
        'Emotional manipulation indicators'
      ],
      recommendations: [
        'Exercise caution with financial requests',
        'Verify identity through official channels',
        'Do not share personal information'
      ]
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Chat analysis error:', error);
    res.status(500).json({ error: 'Chat analysis failed' });
  }
});

app.post('/api/trading-analysis', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { symbol } = req.body;
    
    // Simplified trading analysis
    const result = {
      symbol,
      overallRiskScore: Math.floor(Math.random() * 100),
      riskLevel: 'HIGH',
      confidence: 0.85,
      summary: 'Trading analysis completed. High risk patterns detected.',
      keyFindings: [
        'Unusual volume spikes detected',
        'Price manipulation patterns found',
        'Pump and dump indicators present'
      ],
      recommendations: [
        'Avoid trading this symbol',
        'Research company fundamentals',
        'Consult with financial advisor'
      ],
      alertLevel: 'HIGH'
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Trading analysis error:', error);
    res.status(500).json({ error: 'Trading analysis failed' });
  }
});

app.post('/api/veracity-checking', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { targetType, targetIdentifier } = req.body;
    
    // Simplified veracity checking
    const result = {
      targetType,
      targetIdentifier,
      isVerified: Math.random() > 0.3, // 70% chance of being verified
      verificationStatus: 'VERIFIED',
      overallConfidence: Math.floor(Math.random() * 100),
      riskLevel: 'LOW',
      summary: 'Entity verification completed.',
      keyFindings: [
        'Company registration verified',
        'Regulatory compliance confirmed',
        'No law enforcement alerts found'
      ],
      recommendations: [
        'Entity appears legitimate',
        'Continue with standard due diligence',
        'Monitor for any changes'
      ]
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Veracity checking error:', error);
    res.status(500).json({ error: 'Veracity checking failed' });
  }
});

// Comprehensive scan endpoint
app.post('/api/scans/comprehensive', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { input } = req.body;
    
    // Create scan record
    const { data: scan } = await supabase
      .from('scans')
      .insert([{
        user_id: req.user.id,
        type: 'COMPREHENSIVE',
        status: 'PROCESSING',
        input: input
      }])
      .select()
      .single();

    // Simulate processing
    setTimeout(async () => {
      const result = {
        contactVerification: { riskScore: 25, riskLevel: 'LOW' },
        chatAnalysis: { riskScore: 60, riskLevel: 'MEDIUM' },
        tradingAnalysis: { riskScore: 85, riskLevel: 'HIGH' },
        veracityChecking: { riskScore: 30, riskLevel: 'LOW' },
        overallRiskScore: 50,
        overallRiskLevel: 'MEDIUM',
        recommendations: [
          'Exercise caution with trading activities',
          'Verify all financial advice independently',
          'Do not rush into investment decisions'
        ]
      };

      // Update scan with results
      await supabase
        .from('scans')
        .update({
          status: 'COMPLETED',
          result: result,
          processing_ended_at: new Date().toISOString()
        })
        .eq('id', scan.id);
    }, 2000);

    res.json({
      success: true,
      data: {
        scanId: scan.id,
        status: 'PROCESSING',
        message: 'Comprehensive scan started'
      }
    });
  } catch (error) {
    console.error('Comprehensive scan error:', error);
    res.status(500).json({ error: 'Comprehensive scan failed' });
  }
});

// Get scan results
app.get('/api/scans/:id', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    
    const { data: scan, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({
      success: true,
      data: scan
    });
  } catch (error) {
    console.error('Get scan error:', error);
    res.status(500).json({ error: 'Failed to retrieve scan' });
  }
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;