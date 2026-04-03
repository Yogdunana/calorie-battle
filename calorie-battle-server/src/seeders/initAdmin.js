const { User } = require('../models');
const { hashPassword } = require('../utils/password');

const seedAdmin = async () => {
  const existing = await User.findOne({ where: { role: 'admin' } });
  if (existing) {
    console.log('[Seeder] Admin account already exists, skipping.');
    return;
  }

  const password_hash = await hashPassword('admin123456');

  await User.create({
    account: 'admin',
    username: '管理员',
    password_hash,
    role: 'admin',
    status: 'active',
  });

  console.log('[Seeder] Default admin account created (account: admin, password: admin123456)');
};

module.exports = seedAdmin;
