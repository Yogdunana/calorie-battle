require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');
const config = require('./src/config/index');
const seedAdmin = require('./src/seeders/initAdmin');
const seedTasks = require('./src/seeders/initTasks');
const seedItems = require('./src/seeders/initItems');
const seedActivity = require('./src/seeders/initActivity');

const start = async () => {
  try {
    await sequelize.authenticate();

    if (config.isDev) {
      await sequelize.sync({ force: true });
    } else {
      // 生产环境：使用 alter 模式，忽略已存在的列错误
      try {
        await sequelize.sync({ alter: true });
      } catch (err) {
        if (err.message && err.message.includes('Duplicate column')) {
          console.log('Sync: duplicate column warning, skipping...');
        } else {
          throw err;
        }
      }
    }

    await seedAdmin();
    await seedTasks();
    await seedItems();
    await seedActivity();

    const port = config.port;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
};

start();
