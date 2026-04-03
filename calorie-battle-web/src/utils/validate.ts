/**
 * 验证密码
 * 8-16位，必须包含字母和数字
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return '请输入密码';
  }
  if (password.length < 8 || password.length > 16) {
    return '密码长度为8-16位';
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
 * 验证账号
 * 4-20位字母、数字或下划线
 */
export function validateAccount(account: string): string | null {
  if (!account) {
    return '请输入账号';
  }
  if (account.length < 4 || account.length > 20) {
    return '账号长度为4-20位';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(account)) {
    return '账号只能包含字母、数字和下划线';
  }
  return null;
}

/**
 * 验证用户名
 * 2-20位
 */
export function validateUsername(username: string): string | null {
  if (!username) {
    return '请输入用户名';
  }
  if (username.length < 2 || username.length > 20) {
    return '用户名长度为2-20位';
  }
  return null;
}
