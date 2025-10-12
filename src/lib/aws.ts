import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider"

export const credentials = process.env.AWS_ROLE_ARN
  ? awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN })
  : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
  };
