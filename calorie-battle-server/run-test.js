const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const server = spawn('node', ['server.js'], { 
  stdio: ['pipe', 'pipe', 'pipe'], 
  cwd: '/workspace/calorie-battle-server' 
});

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const d = body ? JSON.stringify(body) : null;
    const r = http.request({
      hostname: 'localhost', port: 3000, path, method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { resolve({ raw: b, code: res.statusCode }); } });
    });
    r.on('error', reject);
    if (d) r.write(d);
    r.end();
  });
}

setTimeout(async () => {
  const results = [];
  try {
    let r;
    r = await req('GET', '/api/v1/health');
    results.push('Health: ' + (r.code === 200 ? 'OK' : 'FAIL'));

    r = await req('POST', '/api/v1/auth/login', { account: 'admin', password: 'admin123456' });
    const at = r.data?.accessToken;
    results.push('Admin Login: ' + (r.code === 200 && at ? 'OK' : 'FAIL ' + r.message));

    r = await req('POST', '/api/v1/auth/register', { account: 's001', username: '张三', password: 'Pass1234' });
    results.push('Register: ' + (r.code === 200 ? 'OK' : 'FAIL ' + r.message));

    r = await req('POST', '/api/v1/auth/login', { account: 's001', password: 'Pass1234' });
    const ut = r.data?.accessToken;
    results.push('User Login: ' + (r.code === 200 && ut ? 'OK' : 'FAIL'));

    r = await req('GET', '/api/v1/checkin/tasks', null, ut);
    const taskCount = r.data?.list?.length || r.data?.length || 0;
    results.push('Tasks: ' + (r.code === 200 ? taskCount + ' items' : 'FAIL'));

    r = await req('GET', '/api/v1/admin/dashboard', null, at);
    results.push('Dashboard: ' + (r.code === 200 ? 'OK' : 'FAIL ' + r.message));

    r = await req('GET', '/api/v1/ranking', null, ut);
    results.push('Ranking: ' + (r.code === 200 ? 'OK' : 'FAIL'));

    r = await req('GET', '/api/v1/points/summary', null, ut);
    results.push('Points: ' + (r.code === 200 ? 'OK' : 'FAIL'));

    r = await req('GET', '/api/v1/redemption/items', null, ut);
    const itemCount = r.data?.length || 0;
    results.push('Items: ' + (r.code === 200 ? itemCount + ' items' : 'FAIL'));

    r = await req('GET', '/api/v1/admin/dashboard', null, ut);
    results.push('Permission Deny: ' + (r.code === 403 ? 'OK' : 'FAIL code=' + r.code));

    r = await req('GET', '/api/v1/admin/activity', null, at);
    results.push('Activity: ' + (r.code === 200 && r.data?.name === '卡路里大作战' ? 'OK' : 'FAIL'));

    r = await req('GET', '/api/v1/admin/reviewers', null, at);
    results.push('Reviewers: ' + (r.code === 200 ? 'OK' : 'FAIL'));

    r = await req('POST', '/api/v1/admin/reviewers', { account: 'rev001', username: '审核员', password: 'Rev12345' }, at);
    results.push('Create Reviewer: ' + ((r.code === 200 || r.code === 201) ? 'OK' : 'FAIL ' + r.message));

    r = await req('POST', '/api/v1/auth/login', { account: 'rev001', password: 'Rev12345' });
    const rt = r.data?.accessToken;
    results.push('Reviewer Login: ' + (r.code === 200 && r.data?.user?.role === 'reviewer' ? 'OK' : 'FAIL'));

    r = await req('GET', '/api/v1/review/pending', null, rt);
    results.push('Pending Reviews: ' + (r.code === 200 ? 'OK' : 'FAIL'));

    r = await req('GET', '/api/v1/admin/users', null, at);
    results.push('Users: ' + (r.code === 200 ? 'OK' : 'FAIL'));

    r = await req('GET', '/api/v1/admin/audit-logs', null, at);
    results.push('Audit Logs: ' + (r.code === 200 ? 'OK' : 'FAIL'));

    // Lockout test
    for (let i = 0; i < 5; i++) await req('POST', '/api/v1/auth/login', { account: 's001', password: 'wrong' });
    r = await req('POST', '/api/v1/auth/login', { account: 's001', password: 'wrong' });
    results.push('Lockout: ' + ((r.code === 403 || (r.message && r.message.includes('锁定'))) ? 'OK' : 'WARN code=' + r.code));

  } catch (e) {
    results.push('ERROR: ' + e.message);
  }

  const output = '========== API TEST RESULTS ==========\n' +
    results.map(r => '  ' + r).join('\n') +
    '\n========================================\n';

  fs.writeFileSync('/workspace/test-results.txt', output);
  console.log(output);
  server.kill();
  process.exit(0);
}, 10000);
