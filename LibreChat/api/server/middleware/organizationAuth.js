/**
 * 조직별 인증 미들웨어
 * Organization-specific authentication middleware
 */
const { logger } = require('@librechat/data-schemas');
const orgConfig = require('../../config/organization.config');

/**
 * 이메일 도메인 검증 미들웨어
 */
const validateOrganizationDomain = (req, res, next) => {
  // 도메인 제한이 비활성화된 경우 통과
  if (!orgConfig.emailRestrictions.enabled) {
    return next();
  }
  
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      message: 'Email is required' 
    });
  }
  
  // 이메일 도메인 추출
  const domain = email.split('@')[1];
  
  // 허용된 도메인 확인
  if (!orgConfig.emailRestrictions.allowedDomains.includes(domain)) {
    logger.warn(`Registration attempt with invalid domain: ${domain}`);
    return res.status(403).json({ 
      message: orgConfig.emailRestrictions.errorMessage,
      allowedDomains: orgConfig.emailRestrictions.allowedDomains
    });
  }
  
  // 도메인을 req 객체에 추가
  req.emailDomain = domain;
  next();
};

/**
 * 가입 승인 상태 확인 미들웨어
 */
const checkApprovalStatus = async (req, res, next) => {
  // 승인 기능이 비활성화된 경우 통과
  if (!orgConfig.registration.requireApproval) {
    return next();
  }
  try {
    const { user } = req;
    
    if (!user) {
      return next();
    }
    
    // 관리자는 항상 통과
    if (user.role === 'admin' || user.role === 'superadmin') {
      return next();
    }
    
    // 승인 상태 확인
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({ 
        message: 'Your account is pending approval. Please wait for admin approval.',
        approvalStatus: 'pending'
      });
    }
    
    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({ 
        message: 'Your account registration has been rejected.',
        approvalStatus: 'rejected',
        reason: user.approvalInfo?.rejectionReason
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error checking approval status:', error);
    next(error);
  }
};

/**
 * 사업부/팀 정보 검증 미들웨어
 */
const validateTeamInfo = (req, res, next) => {
  const { division, team } = req.body;
  
  if (!division || !team) {
    return res.status(400).json({ 
      message: 'Division and team information are required' 
    });
  }
  
  // 설정 파일에서 유효한 사업부 목록 가져오기
  const validDivisions = orgConfig.divisions;
  
  if (!validDivisions.includes(division)) {
    return res.status(400).json({ 
      message: 'Invalid division. Please select a valid division.',
      validDivisions 
    });
  }
  
  // 팀명 길이 검증
  if (team.length > 100) {
    return res.status(400).json({ 
      message: 'Team name must be less than 100 characters' 
    });
  }
  
  next();
};

/**
 * 사용량 통계 업데이트 미들웨어
 */
const updateUsageStats = async (req, res, next) => {
  try {
    const { user } = req;
    
    if (user && user._id) {
      // 마지막 활동 시간 업데이트
      const User = require('mongoose').models.User;
      await User.findByIdAndUpdate(user._id, {
        'usageStats.lastActive': new Date()
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error updating usage stats:', error);
    // 에러가 발생해도 요청은 계속 처리
    next();
  }
};

module.exports = {
  validateOrganizationDomain,
  checkApprovalStatus,
  validateTeamInfo,
  updateUsageStats
};