import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    // Nếu chưa cấu hình SMTP thực tế, tự động fallback về log ra console để không gây lỗi
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'test@gmail.com' || !process.env.SMTP_PASS || process.env.SMTP_PASS.includes('xxxx')) {
      console.log(`========================================`);
      console.log(`[SMTP MOCK EMAIL LOG]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: HTML Content omitted (Length: ${html.length} chars)`);
      console.log(`========================================`);
      return { success: true, message: 'Mock email sent to console successfully' };
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Quản Lý Sân Sân Bóng" <noreply@localhost>',
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
export function getBookingEmailTemplate(customerName: string, pitchName: string, startTime: string, endTime: string, totalPrice: string, checkInCode: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #16a34a; text-align: center;">Xác Nhận Đặt Sân Bóng Thành Công!</h2>
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi. Lịch đặt sân của bạn đã được xác nhận thành công với các thông tin chi tiết dưới đây:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Sân bóng</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${pitchName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Giờ bắt đầu</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${startTime}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Giờ kết thúc</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${endTime}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Tổng tiền</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${totalPrice} VND</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Mã Check-in</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace; font-weight: bold; font-size: 16px;">${checkInCode}</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 30px 0;">
        <p>Quét mã QR dưới đây khi đến sân để check-in nhanh:</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${checkInCode}" alt="QR Check-in" style="border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px;"/>
      </div>

      <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
        Vui lòng đến đúng giờ đã hẹn. Nếu cần hỗ trợ hoặc hủy lịch, vui lòng liên hệ bộ phận hỗ trợ khách hàng trước giờ đá 2 tiếng.
      </p>
    </div>
  `;
}
