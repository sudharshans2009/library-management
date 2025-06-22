import { Resend } from "resend";
import { render } from "@react-email/render";
import config from "@/lib/config";
import VerificationEmail from "@/emails/verification-email";
import ResetPasswordEmail from "@/emails/reset-password-email";
import WelcomeEmail from "@/emails/welcome-email";

const resend = new Resend(config.env.resendToken);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const data = await resend.emails.send({
      from: "SS.library <noreply@sudharshans2009.live>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(
  to: string,
  userName: string,
  verificationUrl: string
) {
  const html = await render(
    VerificationEmail({
      userName,
      verificationUrl,
    })
  );

  return sendEmail({
    to,
    subject: "Verify your email address - SS.library",
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetUrl: string
) {
  const html = await render(
    ResetPasswordEmail({
      userName,
      resetUrl,
    })
  );

  return sendEmail({
    to,
    subject: "Reset your password - SS.library",
    html,
  });
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  libraryUrl: string
) {
  const html = await render(
    WelcomeEmail({
      userName,
      libraryUrl,
    })
  );

  return sendEmail({
    to,
    subject: "Welcome to SS.library!",
    html,
  });
}