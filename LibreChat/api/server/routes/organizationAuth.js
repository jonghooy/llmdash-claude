const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logger } = require('@librechat/data-schemas');
const mongoose = require('mongoose');
const orgConfig = require('../../config/organization.config');
const { 
  validateOrganizationDomain, 
  validateTeamInfo,
  checkApprovalStatus 
} = require('../middleware/organizationAuth');

/**
 * 조직별 회원가입 엔드포인트
 * Organization-specific registration endpoint
 */
router.post('/register', 
  validateOrganizationDomain,  // 도메인 검증
  validateTeamInfo,            // 팀 정보 검증
  async (req, res) => {
    try {
      const { 
        email, 
        password, 
        name, 
        division, 
        team, 
        position 
      } = req.body;

      const User = mongoose.models.User;

      // 기존 사용자 확인
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists with this email' 
        });
      }

      // 이메일 도메인 추출
      const emailDomain = email.split('@')[1];

      // 비밀번호 해시
      const hashedPassword = await bcrypt.hash(password, 10);

      // 새 사용자 생성 - User 모델이 organization 필드를 지원하지 않으므로 직접 저장
      const userData = {
        email,
        password: hashedPassword,
        name,
        username: name || '', // name을 username으로도 사용
        provider: 'local',
        role: 'USER',
        company: orgConfig.company.name,
        division,
        team,
        position,
        emailDomain,
        approvalStatus: orgConfig.registration.requireApproval ? 'pending' : 'approved',
        emailVerified: false,
        plugins: [],
        twoFactorEnabled: false,
        termsAccepted: false,
        personalization: {
          memories: true
        },
        backupCodes: [],
        refreshToken: [],
        usageStats: {
          lastActive: new Date(),
          totalMessages: 0,
          totalTokens: 0,
          monthlyMessages: 0,
          monthlyTokens: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // MongoDB에 직접 삽입
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      const result = await usersCollection.insertOne(userData);
      const newUser = { ...userData, _id: result.insertedId };

      // 관리자에게 알림 (선택사항)
      if (orgConfig.registration.notificationEmail) {
        // TODO: 이메일 알림 구현
        logger.info(`New registration pending approval: ${email}`);
      }

      res.status(201).json({
        success: true,
        message: orgConfig.registration.requireApproval 
          ? 'Registration successful. Please wait for admin approval.'
          : 'Registration successful. You can now login.',
        requiresApproval: orgConfig.registration.requireApproval,
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          company: newUser.company,
          division: newUser.division,
          team: newUser.team,
          approvalStatus: newUser.approvalStatus
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Registration failed. Please try again.' 
      });
    }
});

/**
 * 조직별 로그인 엔드포인트
 * Organization-specific login endpoint
 */
router.post('/login', 
  checkApprovalStatus,  // 승인 상태 확인
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const User = mongoose.models.User;

      // 사용자 찾기
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid credentials' 
        });
      }

      // 회사 확인
      if (user.company !== orgConfig.company.name) {
        return res.status(403).json({ 
          message: 'Access denied for this organization' 
        });
      }

      // 승인 상태 확인
      if (orgConfig.registration.requireApproval && user.approvalStatus !== 'approved') {
        return res.status(403).json({ 
          message: user.approvalStatus === 'pending' 
            ? 'Your account is pending approval.'
            : 'Your account has been rejected.',
          approvalStatus: user.approvalStatus
        });
      }

      // 비밀번호 확인
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: 'Invalid credentials' 
        });
      }

      // 마지막 활동 시간 업데이트
      user.usageStats.lastActive = new Date();
      await user.save();

      // JWT 토큰 생성
      const token = jwt.sign(
        { 
          id: user._id,
          email: user.email,
          company: user.company,
          division: user.division,
          team: user.team,
          role: user.role || 'user'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          company: user.company,
          division: user.division,
          team: user.team,
          position: user.position,
          role: user.role
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ 
        message: 'Login failed. Please try again.' 
      });
    }
});

/**
 * 조직 설정 정보 엔드포인트
 * Get organization configuration
 */
router.get('/config', (req, res) => {
  res.json({
    company: {
      name: orgConfig.company.displayName,
      logo: orgConfig.company.logo
    },
    registration: {
      requireApproval: orgConfig.registration.requireApproval,
      allowedDomains: orgConfig.emailRestrictions.enabled 
        ? orgConfig.emailRestrictions.allowedDomains 
        : null
    },
    divisions: orgConfig.divisions,
    divisionDisplayNames: orgConfig.divisionDisplayNames,
    positions: orgConfig.positions,
    features: orgConfig.features
  });
});

/**
 * 사업부별 팀 목록 엔드포인트
 * Get teams by division
 */
router.get('/teams', (req, res) => {
  try {
    const { division } = req.query;
    
    if (!division) {
      return res.status(400).json({
        message: 'Division parameter is required'
      });
    }

    const teams = orgConfig.getTeamsByDivision(division);
    
    res.json({
      division,
      teams
    });
  } catch (error) {
    logger.error('Error fetching teams:', error);
    res.status(500).json({
      message: 'Failed to fetch teams'
    });
  }
});

module.exports = router;