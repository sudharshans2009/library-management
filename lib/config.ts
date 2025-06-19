const config = {
  env: {
    url: process.env.NEXT_PUBLIC_URL!,
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    databaseUrl: process.env.DATABASE_URL!,
    resendToken: process.env.RESEND_TOKEN!,
  },
};

export default config;
