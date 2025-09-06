/**
 * Organization Configuration
 * 조직별 설정을 관리하는 파일입니다.
 * 
 * company_profile.cfg 파일에서 동적으로 조직 정보를 로드합니다.
 */

const configParser = require('./configParser');

// Get configuration from company_profile.cfg
const companyInfo = configParser.getCompanyInfo();
const divisions = configParser.getDivisions();
const divisionDisplayNames = configParser.getDivisionDisplayNames();
const settings = configParser.getSettings();

module.exports = {
  // 회사 정보 (company_profile.cfg에서 로드)
  company: {
    name: companyInfo.name || 'Timbel',
    displayName: companyInfo.display_name || 'Timbel Corporation',
    logo: process.env.COMPANY_LOGO_URL || '/assets/logo.png',
    domain: companyInfo.domain || 'timbel.net'
  },

  // 이메일 도메인 제한
  emailRestrictions: {
    enabled: process.env.EMAIL_RESTRICTION_ENABLED !== 'false', // 기본값 true
    allowedDomains: process.env.ALLOWED_DOMAINS 
      ? process.env.ALLOWED_DOMAINS.split(',') 
      : [companyInfo.domain || 'timbel.net'],
    errorMessage: 'Registration is only allowed for company email addresses'
  },

  // 가입 승인 설정
  registration: {
    requireApproval: settings.require_approval === 'true' || process.env.REQUIRE_APPROVAL !== 'false',
    autoApproveAdmins: true, // 관리자는 자동 승인
    defaultStatus: settings.default_approval_status || 'pending',
    notificationEmail: settings.notification_email || process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@timbel.net'
  },

  // 사업부 목록 (company_profile.cfg에서 로드)
  divisions: divisions.length > 0 ? divisions : [
    'Engineering',
    'Sales',
    'Marketing',
    'HR',
    'Finance',
    'Operations',
    'R&D',
    'Customer Success',
    'Product',
    'Legal',
    'Other'
  ],

  // 사업부 표시명 매핑
  divisionDisplayNames,

  // 직급 목록 (선택사항)
  positions: [
    'Intern',
    'Junior',
    'Senior',
    'Lead',
    'Manager',
    'Director',
    'VP',
    'C-Level',
    'Other'
  ],

  // 사용량 제한 (선택사항)
  usageLimits: {
    enabled: process.env.USAGE_LIMITS_ENABLED === 'true', // 기본값 false
    defaultMonthlyMessages: parseInt(process.env.DEFAULT_MONTHLY_MESSAGES || '1000'),
    defaultMonthlyTokens: parseInt(process.env.DEFAULT_MONTHLY_TOKENS || '1000000')
  },

  // 기능 플래그
  features: {
    teamStatistics: true, // 팀 통계 기능
    divisionStatistics: true, // 사업부 통계 기능
    userApproval: true, // 사용자 승인 기능
    costTracking: false, // 비용 추적 기능 (추후 구현)
    customBranding: true // 커스텀 브랜딩
  },

  // Helper methods for team validation
  getTeamsByDivision: (divisionKey) => configParser.getTeamsByDivision(divisionKey),
  getAllTeams: () => configParser.getAllTeams(),
  isValidDivision: (divisionKey) => configParser.isValidDivision(divisionKey),
  isValidTeam: (divisionKey, teamName) => configParser.isValidTeam(divisionKey, teamName),
  reloadConfig: () => configParser.reload()
};