const { SensitiveWord } = require('../models');
const { error } = require('../utils/response');

const checkSensitiveWords = async (text) => {
  if (!text || typeof text !== 'string') return false;

  const words = await SensitiveWord.findAll({
    attributes: ['word'],
  });

  for (const item of words) {
    if (text.includes(item.word)) {
      return item.word;
    }
  }
  return false;
};

const sensitiveFilter = (fields) => {
  return async (req, res, next) => {
    try {
      for (const field of fields) {
        const value = req.body[field];
        if (value && typeof value === 'string') {
          const found = await checkSensitiveWords(value);
          if (found) {
            return error(res, 400, `内容包含敏感词: ${found}`);
          }
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = sensitiveFilter;
