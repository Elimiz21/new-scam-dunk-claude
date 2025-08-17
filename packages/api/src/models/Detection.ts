import mongoose, { Document, Schema } from 'mongoose';

export interface IDetection extends Document {
  _id: string;
  scanId: string;
  type: 'scam_pattern' | 'fraud_indicator' | 'risk_signal' | 'anomaly' | 'verification_failure';
  category: 'financial' | 'social' | 'technical' | 'behavioral' | 'regulatory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  title: string;
  description: string;
  evidence: {
    data: any;
    source: string;
    timestamp: Date;
    metadata?: any;
  };
  ruleId?: string; // Reference to detection rule
  isConfirmed: boolean;
  isFalsePositive: boolean;
  reviewedBy?: string; // User ID of reviewer
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const detectionSchema = new Schema<IDetection>({
  scanId: {
    type: String,
    required: [true, 'Scan ID is required'],
    ref: 'Scan'
  },
  type: {
    type: String,
    enum: ['scam_pattern', 'fraud_indicator', 'risk_signal', 'anomaly', 'verification_failure'],
    required: [true, 'Detection type is required']
  },
  category: {
    type: String,
    enum: ['financial', 'social', 'technical', 'behavioral', 'regulatory'],
    required: [true, 'Detection category is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Severity is required']
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Confidence score is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  evidence: {
    data: {
      type: Schema.Types.Mixed,
      required: true
    },
    source: {
      type: String,
      required: [true, 'Evidence source is required']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: Schema.Types.Mixed
  },
  ruleId: {
    type: String,
    ref: 'DetectionRule'
  },
  isConfirmed: {
    type: Boolean,
    default: false
  },
  isFalsePositive: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: {
    type: String,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
detectionSchema.index({ scanId: 1, severity: -1 });
detectionSchema.index({ type: 1, category: 1 });
detectionSchema.index({ severity: 1, confidence: -1 });
detectionSchema.index({ createdAt: -1 });
detectionSchema.index({ isConfirmed: 1, isFalsePositive: 1 });

// Virtual for weighted score (combines severity and confidence)
detectionSchema.virtual('weightedScore').get(function(this: IDetection) {
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
  return (severityWeights[this.severity] * this.confidence) / 100;
});

// Static method to get detections by scan
detectionSchema.statics.findByScan = function(scanId: string) {
  return this.find({ scanId })
    .sort({ severity: -1, confidence: -1 })
    .populate('reviewedBy', 'firstName lastName');
};

// Static method to get critical detections
detectionSchema.statics.findCritical = function(limit: number = 50) {
  return this.find({ 
    severity: 'critical',
    isConfirmed: { $ne: true },
    isFalsePositive: { $ne: true }
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('scanId', 'userId type')
    .populate('reviewedBy', 'firstName lastName');
};

// Instance method to mark as reviewed
detectionSchema.methods.markReviewed = function(reviewerId: string, notes?: string, isConfirmed?: boolean) {
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  if (typeof isConfirmed === 'boolean') this.isConfirmed = isConfirmed;
  return this.save();
};

export default mongoose.model<IDetection>('Detection', detectionSchema);