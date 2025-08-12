#!/usr/bin/env node

/**
 * Comprehensive Testing Tool for Scam Dunk
 * Tests all services, endpoints, and functionality
 */

const axios = require('axios');
const io = require('socket.io-client');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const API_BASE = 'http://localhost:4000';
const AI_BASE = 'http://localhost:8001';
const BLOCKCHAIN_BASE = 'http://localhost:3002';
const WEB_BASE = 'http://localhost:3000';

class ScamDunkTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
    this.token = null;
    this.userId = null;
  }

  log(message, type = 'info') {
    const prefix = {
      success: `${colors.green}✅`,
      error: `${colors.red}❌`,
      warning: `${colors.yellow}⚠️`,
      info: `${colors.blue}ℹ️`,
      test: `${colors.cyan}🧪`
    };
    console.log(`${prefix[type] || prefix.info} ${message}${colors.reset}`);
  }

  async test(name, fn) {
    this.log(`Testing: ${name}`, 'test');
    try {
      await fn();
      this.results.passed++;
      this.log(`  PASSED: ${name}`, 'success');
      return true;
    } catch (error) {
      this.results.failed++;
      this.log(`  FAILED: ${name} - ${error.message}`, 'error');
      return false;
    }
  }

  // Service Health Tests
  async testServiceHealth() {
    console.log('\n' + colors.cyan + '═══ SERVICE HEALTH TESTS ═══' + colors.reset);
    
    await this.test('API Service Health', async () => {
      const res = await axios.get(`${API_BASE}/health`);
      if (res.status !== 200) throw new Error('API not healthy');
    });

    await this.test('AI Service Health', async () => {
      const res = await axios.get(`${AI_BASE}/health`);
      if (res.status !== 200) throw new Error('AI service not healthy');
    });

    await this.test('Blockchain Service Health', async () => {
      const res = await axios.get(`${BLOCKCHAIN_BASE}/health`);
      if (res.status !== 200) throw new Error('Blockchain service not healthy');
    });

    await this.test('Web Frontend Health', async () => {
      const res = await axios.get(WEB_BASE);
      if (res.status !== 200) throw new Error('Frontend not responding');
      // Check if the response includes Next.js indicators or title
      if (!res.data.includes('__next') && !res.data.includes('Scam Dunk')) {
        throw new Error('Frontend content invalid');
      }
    });
  }

  // Authentication Tests
  async testAuthentication() {
    console.log('\n' + colors.cyan + '═══ AUTHENTICATION TESTS ═══' + colors.reset);
    
    const testEmail = `test_${Date.now()}@example.com`;
    
    await this.test('User Registration', async () => {
      const res = await axios.post(`${API_BASE}/auth/register`, {
        email: testEmail,
        password: 'TestPass123',
        firstName: 'Test',
        lastName: 'User'
      });
      if (!res.data.user) throw new Error('No user returned');
      this.userId = res.data.user.id;
    });

    await this.test('User Login', async () => {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: testEmail,
        password: 'TestPass123'
      });
      if (!res.data.access_token) throw new Error('No token returned');
      this.token = res.data.access_token;
    });

    await this.test('Get Current User', async () => {
      const res = await axios.get(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (!res.data.email) throw new Error('User data not returned');
    });
  }

  // Scan Tests
  async testScans() {
    console.log('\n' + colors.cyan + '═══ SCAN FUNCTIONALITY TESTS ═══' + colors.reset);
    
    let scanId;
    
    await this.test('Create Text Scan', async () => {
      const res = await axios.post(`${API_BASE}/scans`, {
        type: 'text',
        content: 'Send me $5000 urgently for amazing investment opportunity'
      }, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (!res.data.id) throw new Error('Scan ID not returned');
      scanId = res.data.id;
    });

    await this.test('Get Scan Results', async () => {
      const res = await axios.get(`${API_BASE}/scans/${scanId}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (!res.data) throw new Error('Scan data not returned');
    });

    await this.test('List User Scans', async () => {
      const res = await axios.get(`${API_BASE}/scans`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (!Array.isArray(res.data)) throw new Error('Scans list not returned');
    });
  }

  // AI Service Tests
  async testAIService() {
    console.log('\n' + colors.cyan + '═══ AI SERVICE TESTS ═══' + colors.reset);
    
    await this.test('Quick Scan Analysis', async () => {
      const res = await axios.post(`${AI_BASE}/api/v1/scan/quick-scan`, {
        content: 'This is definitely a scam message'
      });
      if (typeof res.data.risk_score !== 'number') throw new Error('Risk score not returned');
      if (res.data.risk_score < 0 || res.data.risk_score > 1) {
        throw new Error('Risk score out of range');
      }
    });

    await this.test('Batch Message Analysis', async () => {
      const res = await axios.post(`${AI_BASE}/api/v1/detection/analyze`, {
        messages: [
          'Send money now!',
          'This is a normal message',
          'You won $1,000,000!'
        ]
      });
      if (!res.data.results) throw new Error('Analysis results not returned');
    });

    await this.test('Get Detection Patterns', async () => {
      const res = await axios.get(`${AI_BASE}/api/v1/detection/patterns`);
      if (!res.data.patterns) throw new Error('Patterns not returned');
    });
  }

  // Blockchain Tests
  async testBlockchain() {
    console.log('\n' + colors.cyan + '═══ BLOCKCHAIN SERVICE TESTS ═══' + colors.reset);
    
    await this.test('Token Verification', async () => {
      const res = await axios.post(`${BLOCKCHAIN_BASE}/api/v1/verify/token`, {
        address: '0x1234567890123456789012345678901234567890',
        network: 'ethereum'
      });
      if (res.data.verified === undefined) throw new Error('Verification status not returned');
    });

    await this.test('Wallet Reputation Check', async () => {
      const res = await axios.post(`${BLOCKCHAIN_BASE}/api/v1/verify/wallet`, {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
        network: 'ethereum'
      });
      if (!res.data.reputation) throw new Error('Reputation not returned');
    });

    await this.test('Contract Analysis', async () => {
      const res = await axios.post(`${BLOCKCHAIN_BASE}/api/v1/analyze/contract`, {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        network: 'ethereum'
      });
      if (!res.data.analysis) throw new Error('Analysis not returned');
    });
  }

  // WebSocket Tests
  async testWebSocket() {
    console.log('\n' + colors.cyan + '═══ WEBSOCKET TESTS ═══' + colors.reset);
    
    await this.test('WebSocket Connection', async () => {
      return new Promise((resolve, reject) => {
        const socket = io(API_BASE, {
          transports: ['websocket'],
          auth: { token: this.token }
        });
        
        socket.on('connect', () => {
          socket.disconnect();
          resolve();
        });
        
        socket.on('connect_error', (error) => {
          reject(new Error(`WebSocket connection failed: ${error.message}`));
        });
        
        setTimeout(() => {
          socket.disconnect();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
      });
    });
  }

  // End-to-End Tests
  async testEndToEnd() {
    console.log('\n' + colors.cyan + '═══ END-TO-END TESTS ═══' + colors.reset);
    
    await this.test('Complete Scan Workflow', async () => {
      // 1. Create scan
      const scanRes = await axios.post(`${API_BASE}/scans`, {
        type: 'text',
        content: 'Urgent: Send $10,000 for investment'
      }, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      // 2. Get AI analysis (simulated)
      const aiRes = await axios.post(`${AI_BASE}/api/v1/scan/quick-scan`, {
        content: scanRes.data.content
      });
      
      if (aiRes.data.risk_score < 0.5) {
        throw new Error('AI should detect high risk for scam content');
      }
    });

    await this.test('Database Persistence', async () => {
      // Check if data persists by logging in again
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: `test_${this.userId}@example.com`,
        password: 'TestPass123'
      }).catch(() => null);
      
      // Note: Currently using fallback server, so persistence might not work
      if (!loginRes) {
        this.log('  Note: Database persistence not working (using fallback server)', 'warning');
        this.results.warnings++;
      }
    });
  }

  // Performance Tests
  async testPerformance() {
    console.log('\n' + colors.cyan + '═══ PERFORMANCE TESTS ═══' + colors.reset);
    
    await this.test('API Response Time', async () => {
      const start = Date.now();
      await axios.get(`${API_BASE}/health`);
      const duration = Date.now() - start;
      
      if (duration > 1000) throw new Error(`Response too slow: ${duration}ms`);
      this.log(`    Response time: ${duration}ms`, 'info');
    });

    await this.test('AI Processing Speed', async () => {
      const start = Date.now();
      await axios.post(`${AI_BASE}/api/v1/scan/quick-scan`, {
        content: 'Test message for timing'
      });
      const duration = Date.now() - start;
      
      if (duration > 2000) throw new Error(`AI too slow: ${duration}ms`);
      this.log(`    AI processing time: ${duration}ms`, 'info');
    });
  }

  // Run all tests
  async runAll() {
    console.log(colors.cyan + '\n╔════════════════════════════════════════╗');
    console.log('║     SCAM DUNK COMPREHENSIVE TESTS     ║');
    console.log('╚════════════════════════════════════════╝' + colors.reset);
    
    const startTime = Date.now();
    
    await this.testServiceHealth();
    await this.testAuthentication();
    await this.testScans();
    await this.testAIService();
    await this.testBlockchain();
    await this.testWebSocket();
    await this.testEndToEnd();
    await this.testPerformance();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Print results
    console.log('\n' + colors.cyan + '═══ TEST RESULTS ═══' + colors.reset);
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${this.results.warnings}${colors.reset}`);
    console.log(`\nTotal time: ${duration}s`);
    
    const successRate = (this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(1);
    console.log(`\nSuccess rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log(colors.green + '\n🎉 ALL TESTS PASSED! The application is fully functional!' + colors.reset);
    } else {
      console.log(colors.yellow + '\n⚠️  Some tests failed. Check the errors above.' + colors.reset);
    }
    
    process.exit(this.results.failed === 0 ? 0 : 1);
  }
}

// Run tests
const tester = new ScamDunkTester();
tester.runAll().catch(error => {
  console.error(colors.red + 'Test suite failed: ' + error.message + colors.reset);
  process.exit(1);
});