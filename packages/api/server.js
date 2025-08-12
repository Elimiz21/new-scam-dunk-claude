const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Auth endpoints
app.post('/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  res.json({ 
    message: 'User registered successfully',
    user: { 
      id: Date.now(), 
      email,
      name,
      created_at: new Date().toISOString()
    }
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({ 
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify({
      id: 1,
      email,
      exp: Date.now() + 3600000
    })).toString('base64'),
    refresh_token: 'refresh_' + Date.now(),
    user: { id: 1, email, name: 'Test User' }
  });
});

app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.post('/auth/refresh', (req, res) => {
  res.json({ 
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Date.now(),
    refresh_token: 'refresh_' + Date.now()
  });
});

app.post('/auth/forgot-password', (req, res) => {
  res.json({ message: 'Password reset email sent' });
});

app.post('/auth/reset-password', (req, res) => {
  res.json({ message: 'Password reset successfully' });
});

app.post('/auth/verify-email', (req, res) => {
  res.json({ message: 'Email verified successfully' });
});

app.post('/auth/resend-verification', (req, res) => {
  res.json({ message: 'Verification email resent' });
});

// User endpoints
app.get('/users/me', (req, res) => {
  res.json({ 
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    created_at: new Date().toISOString()
  });
});

app.put('/users/me', (req, res) => {
  res.json({ 
    id: 1,
    ...req.body,
    updated_at: new Date().toISOString()
  });
});

app.get('/users/me/stats', (req, res) => {
  res.json({ 
    total_scans: Math.floor(Math.random() * 100),
    threats_detected: Math.floor(Math.random() * 50),
    risk_score_avg: Math.random().toFixed(2),
    member_since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  });
});

app.delete('/users/me', (req, res) => {
  res.json({ message: 'Account deleted successfully' });
});

// Scan endpoints
app.post('/scans', (req, res) => {
  const scanId = 'scan_' + Date.now();
  res.json({ 
    id: scanId,
    type: req.body.type || 'quick',
    status: 'processing',
    content: req.body.content,
    risk_score: null,
    created_at: new Date().toISOString()
  });
  
  // Simulate scan completion
  setTimeout(() => {
    io.emit('scan_complete', {
      id: scanId,
      status: 'completed',
      risk_score: Math.random(),
      threats_found: Math.floor(Math.random() * 5)
    });
  }, 3000);
});

app.get('/scans', (req, res) => {
  res.json([
    { 
      id: 'scan_1', 
      status: 'completed', 
      risk_score: 0.2,
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    { 
      id: 'scan_2', 
      status: 'completed', 
      risk_score: 0.8,
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  ]);
});

app.get('/scans/:id', (req, res) => {
  res.json({ 
    id: req.params.id,
    status: 'completed',
    risk_score: Math.random(),
    content: 'Sample scan content',
    threats: [
      { type: 'phishing', confidence: 0.9 },
      { type: 'scam', confidence: 0.7 }
    ],
    created_at: new Date().toISOString()
  });
});

// Chat Import endpoints
app.post('/chat-import/initialize', (req, res) => {
  res.json({
    uploadId: 'upload_' + Date.now(),
    status: 'initialized',
    chunks_expected: Math.ceil((req.body.fileSize || 1024) / 1024)
  });
});

app.post('/chat-import/upload-chunk/:uploadId/:chunkIndex', (req, res) => {
  res.json({
    uploadId: req.params.uploadId,
    chunkIndex: req.params.chunkIndex,
    status: 'received'
  });
});

app.post('/chat-import/finalize', (req, res) => {
  res.json({
    uploadId: req.body.uploadId,
    status: 'processing',
    message: 'Chat import started'
  });
});

app.post('/chat-import/upload', (req, res) => {
  res.json({
    id: 'import_' + Date.now(),
    status: 'processing',
    message_count: Math.floor(Math.random() * 1000)
  });
});

app.delete('/chat-import/upload/:uploadId', (req, res) => {
  res.json({ message: 'Upload cancelled' });
});

app.get('/chat-import/upload/:uploadId/progress', (req, res) => {
  res.json({
    uploadId: req.params.uploadId,
    progress: Math.floor(Math.random() * 100),
    status: 'uploading'
  });
});

app.get('/chat-import/status/:id', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'completed',
    messages_processed: Math.floor(Math.random() * 1000),
    threats_found: Math.floor(Math.random() * 10)
  });
});

app.get('/chat-import/results/:id', (req, res) => {
  res.json({
    id: req.params.id,
    total_messages: Math.floor(Math.random() * 1000),
    risk_score: Math.random(),
    threats: [
      { type: 'scam', count: Math.floor(Math.random() * 10) },
      { type: 'phishing', count: Math.floor(Math.random() * 5) }
    ]
  });
});

app.get('/chat-import/list', (req, res) => {
  res.json([
    {
      id: 'import_1',
      platform: 'whatsapp',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]);
});

app.delete('/chat-import/:id', (req, res) => {
  res.json({ message: 'Import deleted' });
});

app.get('/chat-import/supported-formats', (req, res) => {
  res.json({
    formats: ['whatsapp', 'telegram', 'discord', 'instagram'],
    max_file_size: 104857600
  });
});

app.get('/chat-import/:id/analysis', (req, res) => {
  res.json({
    id: req.params.id,
    analysis: {
      sentiment: 'negative',
      risk_level: 'high',
      key_indicators: ['urgency', 'money_request', 'suspicious_links']
    }
  });
});

// Detection endpoints
app.get('/detections/scan/:scanId', (req, res) => {
  res.json([
    {
      id: 'det_1',
      scan_id: req.params.scanId,
      type: 'phishing',
      severity: 'high',
      confidence: 0.9,
      details: { pattern: 'urgent_request' }
    }
  ]);
});

// Notification endpoints
app.get('/notifications', (req, res) => {
  res.json([
    {
      id: 'notif_1',
      type: 'alert',
      title: 'High Risk Detected',
      message: 'A potential scam was detected',
      read: false,
      created_at: new Date().toISOString()
    }
  ]);
});

app.put('/notifications/:id/read', (req, res) => {
  res.json({
    id: req.params.id,
    read: true
  });
});

// Blockchain endpoint (proxy)
app.get('/blockchain/analyze/:network/:address', async (req, res) => {
  try {
    const response = await fetch(`http://blockchain:3002/api/v1/verify/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: req.params.address,
        network: req.params.network
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json({
      address: req.params.address,
      verified: false,
      error: 'Service unavailable'
    });
  }
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe_scan', (scanId) => {
    socket.join(`scan_${scanId}`);
    console.log(`Client ${socket.id} subscribed to scan ${scanId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
  console.log('WebSocket server active');
  console.log('All endpoints operational');
});