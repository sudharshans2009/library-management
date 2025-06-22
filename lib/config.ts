const config = {
  env: {
    url: process.env.NEXT_PUBLIC_URL!,
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    databaseUrl: process.env.DATABASE_URL!,
    resendToken: process.env.RESEND_TOKEN!,
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
  },
};

export default config;
