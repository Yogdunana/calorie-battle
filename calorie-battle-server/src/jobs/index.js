const cron = require('node-cron');
const expireAllPoints = require('./pointExpiry');

const startJobs = () => {
  cron.schedule('0 0 * * *', () => {
    expireAllPoints();
  });
};

module.exports = { startJobs };
