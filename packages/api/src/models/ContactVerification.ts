import mongoose, { Document, Schema } from 'mongoose';

export interface IContactVerification extends Document {
  _id: string;
  scanId: string;
  phoneNumber: string;
  countryCode: string;
  carrier?: string;
  lineType: 'mobile' | 'landline' | 'voip' | 'unknown';
  isValid: boolean;
  isActive: boolean;
  truecaller: {
    isAvailable: boolean;
    name?: string;
    isSpam: boolean;
    spamScore: number; // 0-100
    tags: string[];
    lastSeen?: Date;
  };
  carrierInfo: {
    name?: string;
    country?: string;
    mcc?: string; // Mobile Country Code
    mnc?: string; // Mobile Network Code
  };
  riskAnalysis: {
    riskScore: number; // 0-100
    riskFactors: Array<{
      factor: string;
      weight: number;
      description: string;
    }>;
    isHighRisk: boolean;
    recommendations: string[];
  };
  additionalData: {
    timezone?: string;
    location?: {
      country: string;
      region?: string;
      city?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    socialProfiles?: Array<{
      platform: string;
      url: string;
      verified: boolean;
    }>;
  };
  verificationHistory: Array<{
    date: Date;
    result: 'verified' | 'failed' | 'suspicious';
    source: string;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const contactVerificationSchema = new Schema<IContactVerification>({
  scanId: {
    type: String,
    required: [true, 'Scan ID is required'],
    ref: 'Scan'
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  countryCode: {
    type: String,
    required: [true, 'Country code is required'],
    maxlength: [3, 'Country code cannot exceed 3 characters']
  },
  carrier: String,
  lineType: {
    type: String,
    enum: ['mobile', 'landline', 'voip', 'unknown'],
    default: 'unknown'
  },
  isValid: {
    type: Boolean,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  truecaller: {
    isAvailable: {
      type: Boolean,
      default: false
    },
    name: String,
    isSpam: {
      type: Boolean,
      default: false
    },
    spamScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    tags: [String],
    lastSeen: Date
  },
  carrierInfo: {
    name: String,
    country: String,
    mcc: String,
    mnc: String
  },
  riskAnalysis: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    riskFactors: [{
      factor: { type: String, required: true },
      weight: { type: Number, required: true },
      description: { type: String, required: true }
    }],
    isHighRisk: {
      type: Boolean,
      required: true
    },
    recommendations: [String]
  },
  additionalData: {
    timezone: String,
    location: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    socialProfiles: [{
      platform: { type: String, required: true },
      url: { type: String, required: true },
      verified: { type: Boolean, default: false }
    }]
  },
  verificationHistory: [{
    date: { type: Date, default: Date.now },
    result: {
      type: String,
      enum: ['verified', 'failed', 'suspicious'],
      required: true
    },
    source: { type: String, required: true },
    notes: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
contactVerificationSchema.index({ phoneNumber: 1 });
contactVerificationSchema.index({ scanId: 1 });
contactVerificationSchema.index({ 'riskAnalysis.riskScore': -1 });
contactVerificationSchema.index({ 'truecaller.isSpam': 1 });
contactVerificationSchema.index({ createdAt: -1 });

// Virtual for formatted phone number
contactVerificationSchema.virtual('formattedPhone').get(function(this: IContactVerification) {
  return `+${this.countryCode}${this.phoneNumber}`;
});

// Virtual for risk level
contactVerificationSchema.virtual('riskLevel').get(function(this: IContactVerification) {
  const score = this.riskAnalysis.riskScore;
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
});

// Static method to find by phone number
contactVerificationSchema.statics.findByPhone = function(phoneNumber: string, countryCode?: string) {
  const query: any = { phoneNumber };
  if (countryCode) query.countryCode = countryCode;
  return this.findOne(query).sort({ createdAt: -1 });
};

// Static method to find high risk contacts
contactVerificationSchema.statics.findHighRisk = function(limit: number = 20) {
  return this.find({ 'riskAnalysis.isHighRisk': true })
    .sort({ 'riskAnalysis.riskScore': -1, createdAt: -1 })
    .limit(limit)
    .populate('scanId', 'userId type');
};

// Static method to find spam numbers
contactVerificationSchema.statics.findSpam = function(limit: number = 20) {
  return this.find({ 'truecaller.isSpam': true })
    .sort({ 'truecaller.spamScore': -1, createdAt: -1 })
    .limit(limit)
    .populate('scanId', 'userId type');
};

// Instance method to add verification history
contactVerificationSchema.methods.addVerificationHistory = function(
  result: 'verified' | 'failed' | 'suspicious',
  source: string,
  notes?: string
) {
  this.verificationHistory.push({
    date: new Date(),
    result,
    source,
    notes
  });
  return this.save();
};

export default mongoose.model<IContactVerification>('ContactVerification', contactVerificationSchema);