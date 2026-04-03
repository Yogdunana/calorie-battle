const nodemailer = require('nodemailer');
const config = require('../config/index');

// 创建 SMTP 传输器
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

// 验证 SMTP 连接
async function verifyConnection() {
  try {
    const t = getTransporter();
    await t.verify();
    return true;
  } catch (err) {
    console.error('[Mail] SMTP 连接失败:', err.message);
    return false;
  }
}

// 通用发送邮件
async function sendMail({ to, subject, html, text }) {
  try {
    const t = getTransporter();
    const info = await t.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
      text: text || '',
    });
    console.log(`[Mail] 邮件已发送: ${to} - ${subject}`);
    return info;
  } catch (err) {
    console.error(`[Mail] 发送失败: ${to} - ${err.message}`);
    throw err;
  }
}

// ========== 邮件模板 ==========

// 验证码邮件
async function sendVerifyCode(to, code, type = '注册') {
  const subject = `【卡路里大作战】${type}验证码：${code}`;
  const html = `
    <div style="max-width:480px;margin:0 auto;padding:20px;font-family:'Microsoft YaHei',sans-serif;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px 12px 0 0;padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🔥 卡路里大作战</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">校园健身活动管理系统</p>
      </div>
      <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;padding:30px;">
        <p style="color:#333;font-size:16px;margin:0 0 20px;">您好，您的${type}验证码为：</p>
        <div style="background:#f7f8fc;border-radius:8px;padding:20px;text-align:center;margin:0 0 20px;">
          <span style="font-size:36px;font-weight:bold;color:#667eea;letter-spacing:8px;">${code}</span>
        </div>
        <p style="color:#999;font-size:13px;margin:0;">验证码有效期为 <strong>5 分钟</strong>，请勿泄露给他人。</p>
        <p style="color:#999;font-size:13px;margin:10px 0 0;">如非本人操作，请忽略此邮件。</p>
      </div>
      <div style="text-align:center;padding:20px;color:#bbb;font-size:12px;">
        <p>此邮件由系统自动发送，请勿回复</p>
      </div>
    </div>
  `;
  return sendMail({ to, subject, html });
}

// 审核通过通知
async function sendApprovalNotice(to, data) {
  const { taskName, points, date } = data;
  const subject = `【卡路里大作战】打卡审核通过 +${points}积分`;
  const html = `
    <div style="max-width:480px;margin:0 auto;padding:20px;font-family:'Microsoft YaHei',sans-serif;">
      <div style="background:linear-gradient(135deg,#43e97b 0%,#38f9d7 100%);border-radius:12px 12px 0 0;padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">✅ 审核通过</h1>
      </div>
      <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;padding:30px;">
        <p style="color:#333;font-size:15px;margin:0 0 15px;">您的打卡记录已通过审核！</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 15px;">
          <tr style="background:#f7f8fc;">
            <td style="padding:12px;color:#666;font-size:14px;border:1px solid #eee;">任务名称</td>
            <td style="padding:12px;color:#333;font-size:14px;border:1px solid #eee;font-weight:bold;">${taskName}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#666;font-size:14px;border:1px solid #eee;">打卡日期</td>
            <td style="padding:12px;color:#333;font-size:14px;border:1px solid #eee;">${date}</td>
          </tr>
          <tr style="background:#f7f8fc;">
            <td style="padding:12px;color:#666;font-size:14px;border:1px solid #eee;">获得积分</td>
            <td style="padding:12px;color:#43e97b;font-size:18px;border:1px solid #eee;font-weight:bold;">+${points}</td>
          </tr>
        </table>
        <p style="color:#999;font-size:13px;margin:0;">继续加油，保持运动好习惯！💪</p>
      </div>
      <div style="text-align:center;padding:20px;color:#bbb;font-size:12px;">
        <p>此邮件由系统自动发送，请勿回复</p>
      </div>
    </div>
  `;
  return sendMail({ to, subject, html });
}

// 审核驳回通知
async function sendRejectionNotice(to, data) {
  const { taskName, reason, date } = data;
  const subject = `【卡路里大作战】打卡审核未通过`;
  const html = `
    <div style="max-width:480px;margin:0 auto;padding:20px;font-family:'Microsoft YaHei',sans-serif;">
      <div style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border-radius:12px 12px 0 0;padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">❌ 审核未通过</h1>
      </div>
      <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;padding:30px;">
        <p style="color:#333;font-size:15px;margin:0 0 15px;">很遗憾，您的打卡记录未通过审核。</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 15px;">
          <tr style="background:#f7f8fc;">
            <td style="padding:12px;color:#666;font-size:14px;border:1px solid #eee;">任务名称</td>
            <td style="padding:12px;color:#333;font-size:14px;border:1px solid #eee;font-weight:bold;">${taskName}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#666;font-size:14px;border:1px solid #eee;">打卡日期</td>
            <td style="padding:12px;color:#333;font-size:14px;border:1px solid #eee;">${date}</td>
          </tr>
          <tr style="background:#f7f8fc;">
            <td style="padding:12px;color:#666;font-size:14px;border:1px solid #eee;">驳回原因</td>
            <td style="padding:12px;color:#f5576c;font-size:14px;border:1px solid #eee;">${reason}</td>
          </tr>
        </table>
        <p style="color:#999;font-size:13px;margin:0;">如有疑问，请联系管理员。</p>
      </div>
      <div style="text-align:center;padding:20px;color:#bbb;font-size:12px;">
        <p>此邮件由系统自动发送，请勿回复</p>
      </div>
    </div>
  `;
  return sendMail({ to, subject, html });
}

// 系统公告邮件
async function sendAnnouncement(to, data) {
  const { title, content } = data;
  const subject = `【卡路里大作战】${title}`;
  const html = `
    <div style="max-width:480px;margin:0 auto;padding:20px;font-family:'Microsoft YaHei',sans-serif;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px 12px 0 0;padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">📢 系统公告</h1>
      </div>
      <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;padding:30px;">
        <h2 style="color:#333;font-size:18px;margin:0 0 15px;">${title}</h2>
        <div style="color:#555;font-size:14px;line-height:1.8;white-space:pre-wrap;">${content}</div>
      </div>
      <div style="text-align:center;padding:20px;color:#bbb;font-size:12px;">
        <p>此邮件由系统自动发送，请勿回复</p>
      </div>
    </div>
  `;
  return sendMail({ to, subject, html });
}

module.exports = {
  verifyConnection,
  sendMail,
  sendVerifyCode,
  sendApprovalNotice,
  sendRejectionNotice,
  sendAnnouncement,
};
