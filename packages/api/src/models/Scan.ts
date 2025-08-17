import mongoose, { Document, Schema } from 'mongoose';

export interface IScan extends Document {
  _id: string;
  userId: string;
  type: 'contact' | 'chat' | 'trading' | 'veracity' | 'comprehensive';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  input: {
    phoneNumber?: string;
    chatContent?: string;
    tradingInfo?: {
      symbol?: string;
      platform?: string;
      amount?: number;
      currency?: string;
    };
    companyInfo?: {
      name?: string;
      website?: string;
      registrationNumber?: string;
    };
    files?: Array<{
      filename: string;
      mimetype: string;
      size: number;
      url?: string;
    }>;
  };
  results: {
    riskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-100
    summary: string;
    details: any; // Flexible object for different scan types
    recommendations: string[];
    flags: Array<{
      type: string;
      severity: 'info' | 'warning' | 'danger';
      message: string;
      evidence?: any;
    }>;
  };
  metadata: {
    startTime: Date;
    endTime?: Date;
    duration?: number; // in milliseconds
    apiCalls: Array<{
      service: string;
      endpoint: string;
      status: number;
      duration: number;
      cost?: number;
    }>;
    processingSteps: Array<{
      step: string;
      status: 'pending' | 'completed' | 'failed';
      startTime: Date;
      endTime?: Date;
      error?: string;
    }>;
  };
  sharing: {
    isPublic: boolean;
    sharedWith: string[]; // Array of user IDs
    reportId?: string; // Public report ID
  };
  createdAt: Date;
  updatedAt: Date;
}

const scanSchema = new Schema<IScan>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['contact', 'chat', 'trading', 'veracity', 'comprehensive'],
    required: [true, 'Scan type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  input: {
    phoneNumber: {
      type: String,
      trim: true
    },
    chatContent: {
      type: String,
      maxlength: [100000, 'Chat content cannot exceed 100,000 characters']
    },
    tradingInfo: {
      symbol: String,
      platform: String,
      amount: Number,
      currency: String
    },
    companyInfo: {
      name: String,
      website: String,
      registrationNumber: String
    },
    files: [{
      filename: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true },
      url: String
    }]
  },
  results: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    summary: {
      type: String,
      default: ''
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    recommendations: [{
      type: String
    }],
    flags: [{
      type: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['info', 'warning', 'danger'],
        required: true
      },
      message: {
        type: String,
        required: true
      },
      evidence: Schema.Types.Mixed
    }]
  },
  metadata: {
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    duration: Number,
    apiCalls: [{
      service: { type: String, required: true },
      endpoint: { type: String, required: true },
      status: { type: Number, required: true },
      duration: { type: Number, required: true },
      cost: Number
    }],
    processingSteps: [{
      step: { type: String, required: true },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      startTime: { type: Date, default: Date.now },
      endTime: Date,
      error: String
    }]
  },
  sharing: {
    isPublic: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      type: String,
      ref: 'User'
    }],
    reportId: {
      type: String,
      unique: true,
      sparse: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ status: 1 });
scanSchema.index({ type: 1 });
scanSchema.index({ 'results.riskLevel': 1 });
scanSchema.index({ 'sharing.reportId': 1 });

// Virtual for processing time
scanSchema.virtual('processingTime').get(function(this: IScan) {
  if (this.metadata.endTime && this.metadata.startTime) {
    return this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
  }
  return null;
});

// Pre-save middleware to calculate duration
scanSchema.pre('save', function(next) {
  if (this.metadata.endTime && this.metadata.startTime) {
    this.metadata.duration = this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
  }
  next();
});

// Static method to get user scans
scanSchema.statics.findByUser = function(userId: string, limit: number = 20) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName email');
};

// Static method to get public scans
scanSchema.statics.findPublic = function(limit: number = 10) {
  return this.find({ 'sharing.isPublic': true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName');
};

export default mongoose.model<IScan>('Scan', scanSchema);