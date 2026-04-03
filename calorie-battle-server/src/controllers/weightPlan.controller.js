const { WeightRecord, User } = require('../models');
const { success, error } = require('../utils/response');
const { getPagination, getPagingData } = require('../utils/pagination');

const submit = async (req, res, next) => {
  try {
    const { record_type } = req.body;
    const userId = req.user.id;

    if (!record_type || !['initial', 'final'].includes(record_type)) {
      return error(res, 400, '请选择记录类型（initial/final）');
    }

    // Check if user already has this type of record
    const existing = await WeightRecord.findOne({
      where: { user_id: userId, record_type },
    });

    if (existing && existing.status === 'approved') {
      return error(res, 400, record_type === 'initial' ? '您已提交过初始体重记录' : '您已提交过最终体重记录');
    }

    // Get screenshot from uploaded file
    let screenshot_url = null;
    if (req.file) {
      screenshot_url = `/uploads/weight/${req.file.filename}`;
    }

    const record = await WeightRecord.create({
      user_id: userId,
      record_type,
      screenshot_url,
      status: 'pending',
    });

    req.auditLog = {
      action: 'submit_weight',
      targetType: 'weight_record',
      targetId: record.id,
      detail: { record_type },
    };

    return success(res, { id: record.id }, '体重记录提交成功，等待管理员审核');
  } catch (err) {
    next(err);
  }
};

const getMyRecords = async (req, res, next) => {
  try {
    const records = await WeightRecord.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    // Only show weight/body_fat when status is approved
    const sanitizedRecords = records.map((r) => {
      const item = r.toJSON();
      if (item.status !== 'approved') {
        item.weight = null;
        item.body_fat = null;
      }
      return item;
    });

    return success(res, sanitizedRecords, '获取体重记录成功');
  } catch (err) {
    next(err);
  }
};

const getPendingRecords = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, record_type, status } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = {};
    if (record_type) where.record_type = record_type;
    if (status) where.status = status;
    else where.status = 'pending';

    const result = await WeightRecord.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'account', 'username'] },
      ],
      order: [['created_at', 'ASC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);

    return success(res, data, '获取体重记录列表成功');
  } catch (err) {
    next(err);
  }
};

const reviewRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, weight, body_fat, reject_reason } = req.body;
    const reviewerId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return error(res, 400, '操作类型无效');
    }

    const record = await WeightRecord.findByPk(id);
    if (!record) {
      return error(res, 404, '记录不存在');
    }

    if (record.status !== 'pending') {
      return error(res, 400, '该记录已审核');
    }

    if (action === 'approve') {
      if (weight === undefined || weight === null || weight === '') {
        return error(res, 400, '通过审核时必须填写体重数据');
      }

      const updateData = {
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        weight: parseFloat(weight),
      };

      if (body_fat !== undefined && body_fat !== null && body_fat !== '') {
        updateData.body_fat = parseFloat(body_fat);
      }

      await record.update(updateData);

      req.auditLog = {
        action: 'approve_weight',
        targetType: 'weight_record',
        targetId: id,
        detail: { weight, body_fat },
      };

      return success(res, null, '体重记录审核通过');
    } else {
      if (!reject_reason) {
        return error(res, 400, '请填写驳回原因');
      }

      await record.update({
        status: 'rejected',
        reject_reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      });

      req.auditLog = {
        action: 'reject_weight',
        targetType: 'weight_record',
        targetId: id,
        detail: { reject_reason },
      };

      return success(res, null, '体重记录已驳回');
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submit,
  getMyRecords,
  getPendingRecords,
  reviewRecord,
};
