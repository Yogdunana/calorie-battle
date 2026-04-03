/**
 * XSS 输入过滤中间件
 * 对请求体中的字符串字段进行 HTML 实体转义
 */

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * 对指定字段进行 XSS 过滤
 * @param  {...string} fields - 需要过滤的字段名
 */
const sanitize = (...fields) => {
  return (req, res, next) => {
    try {
      for (const field of fields) {
        if (req.body && req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = escapeHtml(req.body[field]);
        }
        if (req.query && req.query[field] && typeof req.query[field] === 'string') {
          req.query[field] = escapeHtml(req.query[field]);
        }
        if (req.params && req.params[field] && typeof req.params[field] === 'string') {
          req.params[field] = escapeHtml(req.params[field]);
        }
      }
    } catch (err) {
      // 过滤失败不应阻断请求
    }
    next();
  };
};

/**
 * 全局 XSS 过滤（对所有字符串字段）
 */
const sanitizeAll = (req, res, next) => {
  try {
    const sanitizeObj = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          obj[key] = escapeHtml(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObj(obj[key]);
        }
      }
    };
    if (req.body) sanitizeObj(req.body);
    if (req.query) sanitizeObj(req.query);
    if (req.params) sanitizeObj(req.params);
  } catch (err) {
    // 过滤失败不应阻断请求
  }
  next();
};

module.exports = { sanitize, sanitizeAll, escapeHtml };
