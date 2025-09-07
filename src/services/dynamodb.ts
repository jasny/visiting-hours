'use server';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { fromTokenFile } from '@aws-sdk/credential-providers';

const credentials =
  process.env.NODE_ENV === 'production'
    ? fromTokenFile({
        roleArn: process.env.AWS_ROLE_ARN!,
        webIdentityTokenFile: process.env.AWS_WEB_IDENTITY_TOKEN_FILE!,
      })
    : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
      };

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
  credentials,
});

export const db = DynamoDBDocumentClient.from(client);

export default db;
