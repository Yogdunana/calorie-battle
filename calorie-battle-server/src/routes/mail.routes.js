const { Router } = require('express');
const router = Router();
const { success, error } = require('../utils/response');
const mailService = require('../services/mail.service');

// 内存存储验证码（生产环境可用 Redis 替换）
const verifyCodes = new Map();

// 生成 6 位随机验证码
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/v1/mail/send-code
// 发送邮箱验证码
router.post('/send-code', async (req, res, next) => {
  try {
    const { email, type } = req.body;

    if (!email) {
      return error(res, 400, '请输入邮箱地址');
    }

    // 简单邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error(res, 400, '邮箱格式不正确');
    }

    const codeType = type === 'reset' ? '重置密码' : '注册';

    // 检查是否频繁发送（1分钟内只能发一次）
    const existing = verifyCodes.get(email);
    if (existing && Date.now() - existing.createdAt < 60000) {
      const remaining = Math.ceil((60000 - (Date.now() - existing.createdAt)) / 1000);
      return error(res, 429, `请${remaining}秒后再试`);
    }

    const code = generateCode();

    // 存储验证码，5分钟过期
    verifyCodes.set(email, {
      code,
      type: codeType,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // 异步发送邮件（不阻塞响应）
    mailService.sendVerifyCode(email, code, codeType).catch((err) => {
      console.error('[Mail] 验证码发送失败:', err.message);
    });

    return success(res, null, '验证码已发送');
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/mail/verify-code
// 验证邮箱验证码
router.post('/verify-code', async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return error(res, 400, '邮箱和验证码不能为空');
    }

    const record = verifyCodes.get(email);
    if (!record) {
      return error(res, 400, '请先获取验证码');
    }

    if (Date.now() > record.expiresAt) {
      verifyCodes.delete(email);
      return error(res, 400, '验证码已过期，请重新获取');
    }

    if (record.code !== code) {
      return error(res, 400, '验证码错误');
    }

    // 验证成功，删除记录
    verifyCodes.delete(email);

    return success(res, null, '验证码正确');
  } catch (err) {
    next(err);
  }
});

// 导出验证码存储（供 auth controller 使用）
router._verifyCodes = verifyCodes;

module.exports = router;
