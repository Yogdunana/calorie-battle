/**
 * 验证密码
 * 6-32位，必须包含字母和数字
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return '请输入密码';
  }
  if (password.length < 6 || password.length > 32) {
    return '密码长度为6-32位';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return '密码必须包含字母';
  }
  if (!/[0-9]/.test(password)) {
    return '密码必须包含数字';
  }
  return null;
}

/**
 * 验证学号（原账号）
 * 固定10位数字
 */
export function validateAccount(account: string): string | null {
  if (!account) {
    return '请输入学号';
  }
  if (!/^\d{10}$/.test(account)) {
    return '学号为10位数字（如：1120240002）';
  }
  return null;
}

/**
 * 验证姓名（原用户名）
 * 2-20位
 */
export function validateUsername(username: string): string | null {
  if (!username) {
    return '请输入姓名';
  }
  if (username.length < 2 || username.length > 20) {
    return '姓名长度为2-20位';
  }
  return null;
}
