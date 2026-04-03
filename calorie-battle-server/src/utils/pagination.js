const getPagination = (page, pageSize) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 10));
  const offset = (p - 1) * ps;
  return { limit: ps, offset, page: p, pageSize: ps };
};

const getPagingData = (data, page, limit) => {
  const { count: total, rows: list } = data;
  const totalPages = Math.ceil(total / limit);
  return {
    list,
    pagination: {
      page: parseInt(page, 10),
      pageSize: parseInt(limit, 10),
      total,
      totalPages,
    },
  };
};

module.exports = {
  getPagination,
  getPagingData,
};
