const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'coding', 'writing', 'analysis', 'creative', 'business', 'education', 'other'],
    default: 'general'
  },
  prompt: {
    type: String,
    required: true
  },
  variables: [{
    name: String,
    description: String,
    defaultValue: String
  }],
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  usageCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// 인덱스 추가
PromptSchema.index({ name: 1, organization: 1 });
PromptSchema.index({ category: 1, isActive: 1 });
PromptSchema.index({ tags: 1 });

// 사용 횟수 증가 메서드
PromptSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  return this.save();
};

// 조직/팀 권한 확인 메서드
PromptSchema.methods.hasAccess = function(userId, userOrganization, userTeams = []) {
  // Public 프롬프트는 모두 접근 가능
  if (this.isPublic) return true;
  
  // 조직 레벨 프롬프트
  if (this.organization && this.organization.toString() === userOrganization?.toString()) {
    // 특정 팀 제한이 없으면 조직 전체 접근 가능
    if (!this.teams || this.teams.length === 0) return true;
    
    // 특정 팀 제한이 있으면 팀 확인
    return this.teams.some(teamId => 
      userTeams.some(userTeamId => teamId.toString() === userTeamId.toString())
    );
  }
  
  // 생성자는 항상 접근 가능
  if (this.createdBy.toString() === userId.toString()) return true;
  
  return false;
};

// 변수 치환 메서드
PromptSchema.methods.applyVariables = function(values = {}) {
  let processedPrompt = this.prompt;
  
  if (this.variables && this.variables.length > 0) {
    this.variables.forEach(variable => {
      const value = values[variable.name] || variable.defaultValue || '';
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      processedPrompt = processedPrompt.replace(regex, value);
    });
  }
  
  return processedPrompt;
};

const Prompt = mongoose.model('Prompt', PromptSchema);

module.exports = Prompt;