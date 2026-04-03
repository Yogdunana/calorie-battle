/**
 * 简易人机验证（Math CAPTCHA）
 * 
 * 原理：服务端生成数学运算题，客户端需正确回答才能通过。
 * 验证码有时效性（5分钟），绑定 session/token 防重放。
 * 
 * 不依赖任何第三方服务，纯服务端实现。
 */

const crypto = require('crypto');

// 内存存储（生产环境可用 Redis）
const captchaStore = new Map();

// 清理过期验证码（每10分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of captchaStore) {
    if (now > val.expiresAt) captchaStore.delete(key);
  }
}, 10 * 60 * 1000);

/**
 * 生成人机验证题
 * @returns {{ captchaToken: string, question: string }}
 */
function generate() {
  const operations = [
    { symbol: '+', fn: (a, b) => a + b },
    { symbol: '-', fn: (a, b) => a - b },
    { symbol: '×', fn: (a, b) => a * b },
  ];

  const op = operations[Math.floor(Math.random() * operations.length)];
  let a, b;

  // 确保结果为正整数
  if (op.symbol === '-') {
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * a);
  } else if (op.symbol === '×') {
    a = Math.floor(Math.random() * 12) + 2;
    b = Math.floor(Math.random() * 12) + 2;
  } else {
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
  }

  const answer = op.fn(a, b);
  const captchaToken = crypto.randomBytes(16).toString('hex');

  captchaStore.set(captchaToken, {
    answer: answer.toString(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟
    used: false,
  });

  // 随机打乱数字顺序显示，增加机器识别难度
  const displayOrder = Math.random() > 0.5 ? `${a} ${op.symbol} ${b}` : `${b} ${op.symbol} ${a}`;
  // 注意：减法和乘法不适用交换律显示，修正一下
  let question;
  if (op.symbol === '-' || op.symbol === '×') {
    question = `${a} ${op.symbol} ${b} = ?`;
  } else {
    question = `${a} ${op.symbol} ${b} = ?`;
  }

  return { captchaToken, question };
}

/**
 * 验证人机验证答案
 * @param {string} captchaToken
 * @param {string} answer
 * @returns {boolean}
 */
function verify(captchaToken, answer) {
  if (!captchaToken || !answer) return false;

  const record = captchaStore.get(captchaToken);
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    captchaStore.delete(captchaToken);
    return false;
  }

  if (record.used) return false;

  // 验证后立即标记为已使用（防重放）
  record.used = true;
  captchaStore.delete(captchaToken);

  return record.answer === answer.trim();
}

/**
 * 中间件：要求请求携带有效的人机验证
 * 从 req.body.captchaToken 和 req.body.captchaAnswer 读取
 */
function requireCaptcha(req, res, next) {
  const { captchaToken, captchaAnswer } = req.body;

  if (!captchaToken || !captchaAnswer) {
    return res.status(400).json({
      code: 400,
      message: '请完成人机验证',
      data: null,
    });
  }

  if (!verify(captchaToken, captchaAnswer)) {
    return res.status(400).json({
      code: 400,
      message: '人机验证失败，请重试',
      data: null,
    });
  }

  next();
}

module.exports = {
  generate,
  verify,
  requireCaptcha,
};
