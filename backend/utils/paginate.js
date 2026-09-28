// Pagination utility for Sequelize and general use
module.exports = function paginate(page, limit) {
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const pageSize = Math.max(parseInt(limit) || 10, 1);
  const offset = (pageNum - 1) * pageSize;
  return { offset, pageSize, pageNum };
};
