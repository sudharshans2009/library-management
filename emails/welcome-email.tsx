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

interface WelcomeEmailProps {
  userName: string;
  libraryUrl: string;
}

export const WelcomeEmail = ({
  userName,
  libraryUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to SS.library!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Heading style={h1}>📚 SS.library</Heading>
        </Section>
        <Heading style={h2}>Welcome to SS.library!</Heading>
        <Text style={text}>
          Hi {userName},
        </Text>
        <Text style={text}>
          Welcome to SS.library! Your email has been verified and your account
          is now active. You can start browsing and borrowing books from our
          extensive collection.
        </Text>
        <Text style={text}>
          Here&apos;s what you can do with your new account:
        </Text>
        <ul style={list}>
          <li style={listItem}>Browse thousands of books across all genres</li>
          <li style={listItem}>Borrow books and track your reading history</li>
          <li style={listItem}>Get personalized book recommendations</li>
          <li style={listItem}>Join our reading community</li>
        </ul>
        <Section style={buttonContainer}>
          <Button style={button} href={libraryUrl}>
            Start Browsing Books
          </Button>
        </Section>
        <Text style={footer}>
          Happy reading!<br />
          The SS.library Team
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

const list = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 20px",
  paddingLeft: "20px",
};

const listItem = {
  margin: "8px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#059669",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  fontWeight: "bold",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "48px 20px 0",
  textAlign: "center" as const,
};

export default WelcomeEmail;