const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const jwtConfig = require('../config/jwt');
const mailService = require('../services/mail.service');

// 密码强度校验
function validatePassword(password) {
  if (password.length < 6) return '密码长度不能少于6位';
  if (password.length > 32) return '密码长度不能超过32位';
  if (!/[a-zA-Z]/.test(password)) return '密码需包含至少一个字母';
  if (!/[0-9]/.test(password)) return '密码需包含至少一个数字';
  return null;
}

const register = async (req, res, next) => {
  try {
    const { account, username, password, email } = req.body;

    if (!account || !username || !password) {
      return error(res, 400, '账号、用户名和密码不能为空');
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      return error(res, 400, pwdError);
    }

    const existingAccount = await User.findOne({ where: { account } });
    if (existingAccount) {
      return error(res, 400, '该账号已被注册');
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return error(res, 400, '该用户名已被使用');
    }

    // 如果提供了邮箱，检查是否已被使用
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return error(res, 400, '该邮箱已被注册');
      }
    }

    const password_hash = await hashPassword(password);

    const user = await User.create({
      account,
      username,
      password_hash,
      email: email || null,
      role: 'user',
      status: 'active',
    });

    // 发送注册成功邮件
    if (email) {
      mailService.sendMail({
        to: email,
        subject: '【卡路里大作战】注册成功',
        html: `
          <div style="max-width:480px;margin:0 auto;padding:20px;font-family:'Microsoft YaHei',sans-serif;">
            <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px 12px 0 0;padding:30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">🎉 欢迎加入卡路里大作战！</h1>
            </div>
            <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;padding:30px;">
              <p style="color:#333;font-size:15px;">您好 <strong>${username}</strong>，您已成功注册！</p>
              <p style="color:#666;font-size:14px;">开始您的健身之旅吧，完成每日打卡任务赢取积分！💪</p>
            </div>
          </div>
        `,
      }).catch(() => {});
    }

    const payload = { id: user.id, role: user.role, account: user.account };
    const { accessToken, refreshToken } = generateTokens(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: jwtConfig.refreshSecret ? true : false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return success(res, {
      accessToken,
      user: {
        id: user.id,
        account: user.account,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    }, '注册成功');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return error(res, 400, '账号和密码不能为空');
    }

    const user = await User.findOne({ where: { account } });
    if (!user) {
      return error(res, 400, '账号或密码错误');
    }

    if (user.status === 'disabled') {
      return error(res, 403, '账号已被禁用，请联系管理员');
    }

    // Check lockout
    if (user.status === 'locked' && user.locked_until) {
      const now = new Date();
      if (new Date(user.locked_until) > now) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until) - now) / 60000);
        return error(res, 403, `账号已被锁定，请在${remainingMinutes}分钟后重试`);
      }
      // Lock expired, reset
      await user.update({
        status: 'active',
        login_fail_count: 0,
        locked_until: null,
      });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      const failCount = user.login_fail_count + 1;
      const updateData = { login_fail_count: failCount };

      if (failCount >= 5) {
        updateData.status = 'locked';
        updateData.locked_until = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      }

      await user.update(updateData);

      if (failCount >= 5) {
        return error(res, 403, '密码错误次数过多，账号已被锁定10分钟');
      }
      return error(res, 400, `账号或密码错误，还剩${5 - failCount}次尝试机会`);
    }

    // Reset fail count on successful login
    if (user.login_fail_count > 0) {
      await user.update({
        login_fail_count: 0,
        status: 'active',
        locked_until: null,
      });
    }

    const payload = { id: user.id, role: user.role, account: user.account };
    const { accessToken, refreshToken } = generateTokens(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return success(res, {
      accessToken,
      user: {
        id: user.id,
        account: user.account,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    }, '登录成功');
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return error(res, 401, '未提供刷新令牌');
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'account', 'role', 'status'],
    });

    if (!user || user.status !== 'active') {
      return error(res, 401, '用户不存在或已被禁用');
    }

    const payload = { id: user.id, role: user.role, account: user.account };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return success(res, { accessToken }, '令牌刷新成功');
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 401, '刷新令牌已过期，请重新登录');
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 401, '无效的刷新令牌');
    }
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { account, new_password } = req.body;

    if (!account || !new_password) {
      return error(res, 400, '账号和新密码不能为空');
    }

    const pwdError = validatePassword(new_password);
    if (pwdError) {
      return error(res, 400, pwdError);
    }

    const user = await User.findOne({ where: { account } });
    if (!user) {
      return error(res, 400, '账号不存在');
    }

    const password_hash = await hashPassword(new_password);
    await user.update({
      password_hash,
      login_fail_count: 0,
      status: 'active',
      locked_until: null,
    });

    return success(res, null, '密码重置成功');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return error(res, 400, '旧密码和新密码不能为空');
    }

    const pwdError = validatePassword(new_password);
    if (pwdError) {
      return error(res, 400, pwdError);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return error(res, 400, '用户不存在');
    }

    const isMatch = await comparePassword(old_password, user.password_hash);
    if (!isMatch) {
      return error(res, 400, '旧密码错误');
    }

    const password_hash = await hashPassword(new_password);
    await user.update({ password_hash });

    return success(res, null, '密码修改成功');
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, avatar } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return error(res, 400, '用户不存在');
    }

    const updateData = {};
    if (username) {
      if (username !== user.username) {
        const existing = await User.findOne({ where: { username } });
        if (existing) {
          return error(res, 400, '该用户名已被使用');
        }
      }
      updateData.username = username;
    }
    if (avatar) {
      updateData.avatar = avatar;
    }

    await user.update(updateData);

    return success(res, {
      id: user.id,
      account: user.account,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
    }, '个人信息更新成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  resetPassword,
  changePassword,
  updateProfile,
};
