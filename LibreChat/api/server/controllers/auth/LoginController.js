const { generate2FATempToken } = require('~/server/services/twoFactorService');
const { setAuthTokens } = require('~/server/services/AuthService');
const { logger } = require('~/config');

const loginController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check approval status
    const orgConfig = require('../../../config/organization.config');
    if (orgConfig.registration.requireApproval) {
      // Skip approval check for admin users
      if (req.user.role === 'ADMIN' || req.user.role === 'admin') {
        // Admins bypass approval
      } else if (!req.user.approvalStatus || req.user.approvalStatus === 'pending') {
        // If no approvalStatus field exists, treat as pending for non-admin users
        return res.status(403).json({ 
          message: '계정 승인 대기 중입니다. 관리자 승인 후 이용 가능합니다.',
          approvalStatus: 'pending'
        });
      } else if (req.user.approvalStatus === 'rejected') {
        return res.status(403).json({ 
          message: '계정 등록이 거부되었습니다.',
          approvalStatus: 'rejected',
          reason: req.user.approvalInfo?.rejectionReason
        });
      }
      // Only allow if explicitly approved
      else if (req.user.approvalStatus !== 'approved') {
        return res.status(403).json({ 
          message: '계정 승인이 필요합니다. 관리자에게 문의하세요.',
          approvalStatus: req.user.approvalStatus || 'pending'
        });
      }
    }

    if (req.user.twoFactorEnabled) {
      const tempToken = generate2FATempToken(req.user._id);
      return res.status(200).json({ twoFAPending: true, tempToken });
    }

    const { password: _p, totpSecret: _t, __v, ...user } = req.user;
    user.id = user._id.toString();

    const token = await setAuthTokens(req.user._id, res);

    return res.status(200).send({ token, user });
  } catch (err) {
    logger.error('[loginController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  loginController,
};
