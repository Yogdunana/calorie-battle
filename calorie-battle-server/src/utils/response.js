const success = (res, data = null, message = '操作成功') => {
  return res.status(200).json({
    code: 200,
    message,
    data,
  });
};

const error = (res, code = 500, message = '服务器内部错误') => {
  return res.status(code).json({
    code,
    message,
    data: null,
  });
};

const paginate = (items, page, pageSize, total) => {
  const totalPages = Math.ceil(total / pageSize);
  return {
    list: items,
    pagination: {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      total,
      totalPages,
    },
  };
};

module.exports = {
  success,
  error,
  paginate,
};
