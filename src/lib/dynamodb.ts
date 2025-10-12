import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

const credentials = process.env.AWS_ROLE_ARN
  ? awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN })
  : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
  };

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-west-1",
  endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
  credentials,
});

export const db = DynamoDBDocumentClient.from(client);

export function buildUpdateExpression(payload: Record<string, unknown>) {
  const entries = Object.entries(payload).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const names: Record<string, string> = { "#ref": "reference" };
  const values: Record<string, unknown> = {};
  const sets: string[] = [];

  entries.forEach(([k, v], i) => {
    const nk = `#k${i}`;
    const vk = `:v${i}`;
    names[nk] = k;
    values[vk] = v;          // null wordt gewoon gezet als null
    sets.push(`${nk} = ${vk}`);
  });

  return {
    UpdateExpression: `SET ${sets.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ConditionExpression: "attribute_exists(#ref)",
  }
}

export default db;
