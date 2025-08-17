import mongoose, { Document, Schema } from 'mongoose';

export interface IChatAnalysis extends Document {
  _id: string;
  scanId: string;
  platform: 'whatsapp' | 'telegram' | 'discord' | 'sms' | 'email' | 'other';
  messageCount: number;
  participantCount: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  sentimentAnalysis: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number; // -1 to 1
    emotions: Array<{
      emotion: string;
      confidence: number;
      intensity: number;
    }>;
  };
  scamIndicators: Array<{
    type: 'urgency' | 'money_request' | 'personal_info' | 'suspicious_links' | 'fake_authority' | 'too_good_to_be_true';
    confidence: number; // 0-100
    instances: Array<{
      messageIndex: number;
      text: string;
      timestamp: Date;
      participant?: string;
    }>;
    description: string;
  }>;
  languageAnalysis: {
    primaryLanguage: string;
    languages: Array<{
      language: string;
      confidence: number;
    }>;
    formality: 'formal' | 'informal' | 'mixed';
    complexity: 'simple' | 'moderate' | 'complex';
  };
  entities: Array<{
    type: 'person' | 'organization' | 'location' | 'phone' | 'email' | 'url' | 'crypto_address' | 'bank_account';
    value: string;
    confidence: number;
    mentions: number;
    context: string[];
  }>;
  patterns: Array<{
    pattern: string;
    matches: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
    examples: string[];
  }>;
  riskAssessment: {
    overallRisk: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-100
    riskFactors: Array<{
      factor: string;
      weight: number;
      evidence: string[];
    }>;
    redFlags: string[];
    recommendations: string[];
  };
  aiAnalysis: {
    model: string;
    version: string;
    summary: string;
    keyFindings: string[];
    suspiciousMessages: Array<{
      messageIndex: number;
      text: string;
      reason: string;
      severity: number;
    }>;
    contextualAnalysis: string;
  };
  metadata: {
    processingTime: number; // milliseconds
    analysisDepth: 'basic' | 'standard' | 'comprehensive';
    aiTokensUsed: number;
    costEstimate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const chatAnalysisSchema = new Schema<IChatAnalysis>({
  scanId: {
    type: String,
    required: [true, 'Scan ID is required'],
    ref: 'Scan'
  },
  platform: {
    type: String,
    enum: ['whatsapp', 'telegram', 'discord', 'sms', 'email', 'other'],
    required: [true, 'Platform is required']
  },
  messageCount: {
    type: Number,
    required: [true, 'Message count is required'],
    min: [0, 'Message count cannot be negative']
  },
  participantCount: {
    type: Number,
    required: [true, 'Participant count is required'],
    min: [1, 'Must have at least one participant']
  },
  dateRange: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    }
  },
  sentimentAnalysis: {
    overall: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true
    },
    score: {
      type: Number,
      min: -1,
      max: 1,
      required: true
    },
    emotions: [{
      emotion: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 1, required: true },
      intensity: { type: Number, min: 0, max: 1, required: true }
    }]
  },
  scamIndicators: [{
    type: {
      type: String,
      enum: ['urgency', 'money_request', 'personal_info', 'suspicious_links', 'fake_authority', 'too_good_to_be_true'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    instances: [{
      messageIndex: { type: Number, required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, required: true },
      participant: String
    }],
    description: {
      type: String,
      required: true
    }
  }],
  languageAnalysis: {
    primaryLanguage: {
      type: String,
      required: true
    },
    languages: [{
      language: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 1, required: true }
    }],
    formality: {
      type: String,
      enum: ['formal', 'informal', 'mixed'],
      required: true
    },
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex'],
      required: true
    }
  },
  entities: [{
    type: {
      type: String,
      enum: ['person', 'organization', 'location', 'phone', 'email', 'url', 'crypto_address', 'bank_account'],
      required: true
    },
    value: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    mentions: { type: Number, min: 1, required: true },
    context: [String]
  }],
  patterns: [{
    pattern: { type: String, required: true },
    matches: { type: Number, min: 1, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    description: { type: String, required: true },
    examples: [String]
  }],
  riskAssessment: {
    overallRisk: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    riskFactors: [{
      factor: { type: String, required: true },
      weight: { type: Number, required: true },
      evidence: [String]
    }],
    redFlags: [String],
    recommendations: [String]
  },
  aiAnalysis: {
    model: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    keyFindings: [String],
    suspiciousMessages: [{
      messageIndex: { type: Number, required: true },
      text: { type: String, required: true },
      reason: { type: String, required: true },
      severity: { type: Number, min: 0, max: 100, required: true }
    }],
    contextualAnalysis: {
      type: String,
      required: true
    }
  },
  metadata: {
    processingTime: {
      type: Number,
      required: true
    },
    analysisDepth: {
      type: String,
      enum: ['basic', 'standard', 'comprehensive'],
      required: true
    },
    aiTokensUsed: {
      type: Number,
      required: true
    },
    costEstimate: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
chatAnalysisSchema.index({ scanId: 1 });
chatAnalysisSchema.index({ platform: 1 });
chatAnalysisSchema.index({ 'riskAssessment.riskLevel': 1 });
chatAnalysisSchema.index({ 'riskAssessment.overallRisk': -1 });
chatAnalysisSchema.index({ createdAt: -1 });

// Virtual for conversation duration
chatAnalysisSchema.virtual('conversationDuration').get(function(this: IChatAnalysis) {
  return this.dateRange.endDate.getTime() - this.dateRange.startDate.getTime();
});

// Virtual for messages per day
chatAnalysisSchema.virtual('messagesPerDay').get(function(this: IChatAnalysis) {
  const duration = this.dateRange.endDate.getTime() - this.dateRange.startDate.getTime();
  const durationDays = duration / (1000 * 60 * 60 * 24);
  return Math.round(this.messageCount / Math.max(durationDays, 1));
});

// Static method to find high-risk analyses
chatAnalysisSchema.statics.findHighRisk = function(limit: number = 20) {
  return this.find({ 'riskAssessment.riskLevel': { $in: ['high', 'critical'] } })
    .sort({ 'riskAssessment.overallRisk': -1, createdAt: -1 })
    .limit(limit)
    .populate('scanId', 'userId type');
};

// Static method to find by platform
chatAnalysisSchema.statics.findByPlatform = function(platform: string, limit: number = 20) {
  return this.find({ platform })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('scanId', 'userId type');
};

// Instance method to get risk summary
chatAnalysisSchema.methods.getRiskSummary = function() {
  return {
    overallRisk: this.riskAssessment.overallRisk,
    riskLevel: this.riskAssessment.riskLevel,
    confidence: this.riskAssessment.confidence,
    scamIndicatorCount: this.scamIndicators.length,
    redFlagCount: this.riskAssessment.redFlags.length,
    suspiciousMessageCount: this.aiAnalysis.suspiciousMessages.length
  };
};

export default mongoose.model<IChatAnalysis>('ChatAnalysis', chatAnalysisSchema);