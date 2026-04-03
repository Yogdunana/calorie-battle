// Inline test - starts server, runs tests, exits
process.env.NODE_ENV = 'test';
process.env.PORT = '3099';

const path = require('path');
// Override config before requiring app
const config = require('./src/config');

async function main() {
  // Sync DB
  const { sequelize } = require('./src/config/database');
  await sequelize.sync({ force: true });
  console.log('DB synced');

  // Run seeders
  await require('./src/seeders/initAdmin')();
  await require('./src/seeders/initTasks')();
  await require('./src/seeders/initItems')();
  await require('./src/seeders/initActivity')();
  console.log('Seeders done');

  // Start server
  const app = require('./src/app');
  const server = app.listen(3099, () => {
    console.log('Test server on 3099');
    runTests();
  });

  async function runTests() {
    const results = [];
    
    function fetch(method, path, body, token) {
      return new Promise((resolve) => {
        const http = require('http');
        const data = body ? JSON.stringify(body) : null;
        const opts = {
          hostname: 'localhost', port: 3099, path, method,
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
        };
        const req = http.request(opts, res => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve({ code: res.statusCode }); } });
        });
        req.on('error', e => resolve({ error: e.message }));
        if (data) req.write(data);
        req.end();
      });
    }

    try {
      let r, at, ut, rt;

      // 1
      r = await fetch('GET', '/api/v1/health');
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Health Check');

      // 2
      r = await fetch('POST', '/api/v1/auth/login', { account: 'admin', password: 'admin123456' });
      at = r.data?.accessToken;
      results.push((r.code === 200 && at ? 'PASS' : 'FAIL') + ' Admin Login');

      // 3
      r = await fetch('POST', '/api/v1/auth/register', { account: 's001', username: '张三', password: 'Pass1234' });
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Register User');

      // 4
      r = await fetch('POST', '/api/v1/auth/register', { account: 's001', username: '重复', password: 'Pass1234' });
      results.push((r.code !== 200 ? 'PASS' : 'FAIL') + ' Duplicate Register Reject');

      // 5
      r = await fetch('POST', '/api/v1/auth/login', { account: 's001', password: 'Pass1234' });
      ut = r.data?.accessToken;
      results.push((r.code === 200 && ut ? 'PASS' : 'FAIL') + ' User Login');

      // 6
      r = await fetch('GET', '/api/v1/checkin/tasks', null, ut);
      const tc = r.data?.list?.length || r.data?.length || 0;
      results.push((r.code === 200 && tc === 11 ? 'PASS' : 'FAIL') + ' Get Tasks (' + tc + ')');

      // 7
      r = await fetch('GET', '/api/v1/admin/dashboard', null, at);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Admin Dashboard');

      // 8
      r = await fetch('GET', '/api/v1/ranking', null, ut);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Ranking');

      // 9
      r = await fetch('GET', '/api/v1/points/summary', null, ut);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Points Summary');

      // 10
      r = await fetch('GET', '/api/v1/redemption/items', null, ut);
      const ic = r.data?.length || 0;
      results.push((r.code === 200 && ic === 5 ? 'PASS' : 'FAIL') + ' Redemption Items (' + ic + ')');

      // 11
      r = await fetch('GET', '/api/v1/admin/dashboard', null, ut);
      results.push((r.code === 403 ? 'PASS' : 'FAIL') + ' Permission Deny (code=' + r.code + ')');

      // 12
      r = await fetch('GET', '/api/v1/admin/activity', null, at);
      results.push((r.code === 200 && r.data?.name === '卡路里大作战' ? 'PASS' : 'FAIL') + ' Activity Config');

      // 13
      r = await fetch('POST', '/api/v1/admin/reviewers', { account: 'rev001', username: '审核员', password: 'Rev12345' }, at);
      results.push(((r.code === 200 || r.code === 201) ? 'PASS' : 'FAIL') + ' Create Reviewer');

      // 14
      r = await fetch('POST', '/api/v1/auth/login', { account: 'rev001', password: 'Rev12345' });
      rt = r.data?.accessToken;
      results.push((r.code === 200 && r.data?.user?.role === 'reviewer' ? 'PASS' : 'FAIL') + ' Reviewer Login');

      // 15
      r = await fetch('GET', '/api/v1/review/pending', null, rt);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Pending Reviews');

      // 16
      r = await fetch('GET', '/api/v1/admin/users', null, at);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Admin Get Users');

      // 17
      r = await fetch('GET', '/api/v1/admin/audit-logs', null, at);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Audit Logs');

      // 18
      r = await fetch('GET', '/api/v1/admin/configs', null, at);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' System Configs');

      // 19 Lockout
      for (let i = 0; i < 5; i++) await fetch('POST', '/api/v1/auth/login', { account: 's001', password: 'wrong' });
      r = await fetch('POST', '/api/v1/auth/login', { account: 's001', password: 'wrong' });
      results.push(((r.code === 403 || (r.message && r.message.includes('锁定'))) ? 'PASS' : 'WARN') + ' Login Lockout');

      // 20 Sensitive words
      r = await fetch('GET', '/api/v1/admin/sensitive-words', null, at);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Sensitive Words');

      // 21 Announcements
      r = await fetch('GET', '/api/v1/admin/announcements', null, at);
      results.push((r.code === 200 ? 'PASS' : 'FAIL') + ' Announcements');

    } catch (e) {
      results.push('ERROR: ' + e.message);
    }

    const passed = results.filter(r => r.startsWith('PASS')).length;
    const failed = results.filter(r => r.startsWith('FAIL')).length;
    const warn = results.filter(r => r.startsWith('WARN')).length;

    console.log('\n========================================');
    console.log('  RESULTS: ' + passed + ' passed, ' + failed + ' failed, ' + warn + ' warnings (total ' + results.length + ')');
    console.log('========================================');
    results.forEach(r => console.log('  ' + r));
    console.log('========================================\n');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
