import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
  userName: string;
  resetUrl: string;
}

export const ResetPasswordEmail = ({
  userName,
  resetUrl,
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your SS.library password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Heading style={h1}>📚 SS.library</Heading>
        </Section>
        <Heading style={h2}>Reset your password</Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>
          We received a request to reset your password for your SS.library
          account. Click the button below to create a new password.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Reset Password
          </Button>
        </Section>
        <Text style={text}>
          If the button doesn&apos;t work, you can also copy and paste this link
          into your browser:
        </Text>
        <Text style={link}>{resetUrl}</Text>
        <Text style={text}>
          This password reset link will expire in 1 hour for security reasons.
        </Text>
        <Text style={footer}>
          If you didn&apos;t request a password reset, you can safely ignore
          this email. Your password will remain unchanged.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const logoContainer = {
  padding: "32px 20px",
  textAlign: "center" as const,
};

const h1 = {
  color: "#1f2937",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "normal",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#dc2626",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  fontWeight: "bold",
};

const link = {
  color: "#3b82f6",
  fontSize: "14px",
  margin: "16px 20px",
  wordBreak: "break-all" as const,
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "48px 20px 0",
  textAlign: "center" as const,
};

export default ResetPasswordEmail;
