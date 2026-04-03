const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  let passed = 0, failed = 0;
  const results = [];

  function test(name, fn) {
    return fn().then(result => {
      results.push({ name, result });
      if (result.pass) passed++; else failed++;
    }).catch(err => {
      results.push({ name, result: { pass: false, error: err.message } });
      failed++;
    });
  }

  // 1. Health Check
  await test('Health Check', async () => {
    const r = await request('GET', '/api/v1/health');
    return { pass: r.code === 200, detail: r.message };
  });

  // 2. Admin Login
  let adminToken;
  await test('Admin Login', async () => {
    const r = await request('POST', '/api/v1/auth/login', { account: 'admin', password: 'admin123456' });
    adminToken = r.data?.accessToken;
    return { pass: r.code === 200 && adminToken, detail: `role=${r.data?.user?.role}` };
  });

  // 3. Register User
  await test('Register User', async () => {
    const r = await request('POST', '/api/v1/auth/register', { account: 'test001', username: '测试用户', password: 'Test1234' });
    return { pass: r.code === 200, detail: r.message };
  });

  // 4. Duplicate Register
  await test('Duplicate Register Reject', async () => {
    const r = await request('POST', '/api/v1/auth/register', { account: 'test001', username: '测试用户2', password: 'Test1234' });
    return { pass: r.code === 400 || r.code === 409, detail: r.message };
  });

  // 5. User Login
  let userToken;
  await test('User Login', async () => {
    const r = await request('POST', '/api/v1/auth/login', { account: 'test001', password: 'Test1234' });
    userToken = r.data?.accessToken;
    return { pass: r.code === 200 && userToken, detail: `role=${r.data?.user?.role}` };
  });

  // 6. Get Tasks
  await test('Get Tasks (11 items)', async () => {
    const r = await request('GET', '/api/v1/checkin/tasks', null, userToken);
    const count = r.data?.list?.length || r.data?.length || 0;
    return { pass: r.code === 200 && count === 11, detail: `count=${count}` };
  });

  // 7. Get Dashboard
  await test('Admin Dashboard', async () => {
    const r = await request('GET', '/api/v1/admin/dashboard', null, adminToken);
    return { pass: r.code === 200, detail: `keys=${Object.keys(r.data || {}).join(',')}` };
  });

  // 8. Get Ranking
  await test('Get Ranking', async () => {
    const r = await request('GET', '/api/v1/ranking', null, userToken);
    return { pass: r.code === 200, detail: `users=${r.data?.length || 0}` };
  });

  // 9. Get Points Summary
  await test('Points Summary', async () => {
    const r = await request('GET', '/api/v1/points/summary', null, userToken);
    return { pass: r.code === 200, detail: `points=${JSON.stringify(r.data)}` };
  });

  // 10. Get Redemption Items
  await test('Redemption Items (5 items)', async () => {
    const r = await request('GET', '/api/v1/redemption/items', null, userToken);
    const count = r.data?.length || 0;
    return { pass: r.code === 200 && count === 5, detail: `count=${count}` };
  });

  // 11. Admin Get Reviewers
  await test('Admin Get Reviewers', async () => {
    const r = await request('GET', '/api/v1/admin/reviewers', null, adminToken);
    return { pass: r.code === 200, detail: `count=${r.data?.list?.length || 0}` };
  });

  // 12. Admin Get Audit Logs
  await test('Admin Get Audit Logs', async () => {
    const r = await request('GET', '/api/v1/admin/audit-logs', null, adminToken);
    return { pass: r.code === 200, detail: `count=${r.data?.list?.length || 0}` };
  });

  // 13. Admin Get Activity
  await test('Admin Get Activity', async () => {
    const r = await request('GET', '/api/v1/admin/activity', null, adminToken);
    return { pass: r.code === 200 && r.data?.name === '卡路里大作战', detail: `name=${r.data?.name}` };
  });

  // 14. Admin Get Configs
  await test('Admin Get Configs', async () => {
    const r = await request('GET', '/api/v1/admin/configs', null, adminToken);
    return { pass: r.code === 200, detail: `count=${r.data?.length || 0}` };
  });

  // 15. Permission - User accessing admin
  await test('Permission Deny (user->admin)', async () => {
    const r = await request('GET', '/api/v1/admin/dashboard', null, userToken);
    return { pass: r.code === 403, detail: `code=${r.code}, msg=${r.message}` };
  });

  // 16. Login Lockout (5 wrong passwords)
  await test('Login Lockout After 5 Fails', async () => {
    for (let i = 0; i < 5; i++) {
      await request('POST', '/api/v1/auth/login', { account: 'test001', password: 'wrongpass' });
    }
    const r = await request('POST', '/api/v1/auth/login', { account: 'test001', password: 'wrongpass' });
    return { pass: r.code === 403 || r.message?.includes('锁定'), detail: `code=${r.code}, msg=${r.message}` };
  });

  // 17. Admin Create Reviewer
  await test('Admin Create Reviewer', async () => {
    const r = await request('POST', '/api/v1/admin/reviewers', { account: 'reviewer001', username: '审核员1', password: 'Rev12345' }, adminToken);
    return { pass: r.code === 200 || r.code === 201, detail: `code=${r.code}, msg=${r.message}` };
  });

  // 18. Reviewer Login
  let reviewerToken;
  await test('Reviewer Login', async () => {
    const r = await request('POST', '/api/v1/auth/login', { account: 'reviewer001', password: 'Rev12345' });
    reviewerToken = r.data?.accessToken;
    return { pass: r.code === 200 && r.data?.user?.role === 'reviewer', detail: `role=${r.data?.user?.role}` };
  });

  // 19. Reviewer Get Pending Reviews
  await test('Reviewer Get Pending Reviews', async () => {
    const r = await request('GET', '/api/v1/review/pending', null, reviewerToken);
    return { pass: r.code === 200, detail: `count=${r.data?.list?.length || 0}` };
  });

  // 20. Admin Get Users
  await test('Admin Get Users', async () => {
    const r = await request('GET', '/api/v1/admin/users', null, adminToken);
    return { pass: r.code === 200, detail: `count=${r.data?.list?.length || 0}` };
  });

  // Print results
  console.log('\n========================================');
  console.log(`  TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');
  for (const r of results) {
    const icon = r.result.pass ? '✅' : '❌';
    console.log(`  ${icon} ${r.name}: ${r.result.detail || ''}`);
  }
  console.log('\n========================================');
}

runTests().catch(console.error);
