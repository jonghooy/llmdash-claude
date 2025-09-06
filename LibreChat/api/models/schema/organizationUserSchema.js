const mongoose = require('mongoose');
const orgConfig = require('../../config/organization.config');

// 조직별 사용자 스키마 확장
const organizationUserExtensionSchema = new mongoose.Schema({
  // 회사 정보
  company: {
    type: String,
    default: orgConfig.company.name,
    required: true,
    immutable: true // 변경 불가
  },
  
  // 사업부
  division: {
    type: String,
    required: true,
    enum: orgConfig.divisions
  },
  
  // 팀명
  team: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // 직급/직책
  position: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // 가입 승인 상태
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // 승인/거절 정보
  approvalInfo: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
  },
  
  // 도메인 검증
  emailDomain: {
    type: String,
    required: orgConfig.emailRestrictions.enabled,
    validate: {
      validator: function(v) {
        if (!orgConfig.emailRestrictions.enabled) return true;
        return orgConfig.emailRestrictions.allowedDomains.includes(v);
      },
      message: orgConfig.emailRestrictions.errorMessage
    }
  },
  
  // 사용량 통계용 필드
  usageStats: {
    lastActive: {
      type: Date,
      default: Date.now
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    monthlyMessages: {
      type: Number,
      default: 0
    },
    monthlyTokens: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 인덱스 추가
organizationUserExtensionSchema.index({ division: 1, team: 1 });
organizationUserExtensionSchema.index({ approvalStatus: 1 });
organizationUserExtensionSchema.index({ emailDomain: 1 });

module.exports = organizationUserExtensionSchema;