import { config } from 'dotenv';
config();

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'VisitingHoursPage';

async function rotate(reference: string) {
  if (!reference) {
    console.error('Please provide a reference');
    process.exit(1);
  }

  // Dynamically import to ensure dotenv is loaded first
  const { db } = await import('@/lib/dynamodb');
  const { UpdateCommand, GetCommand } = await import('@aws-sdk/lib-dynamodb');
  const { randomNonce } = await import('@/lib/crypto');
  const { getPageToken } = await import('@/lib/verification');

  // 1. Fetch the page to ensure it exists
  const getRes = await db.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { reference },
    ProjectionExpression: '#ref',
    ExpressionAttributeNames: {
      '#ref': 'reference'
    }
  }));

  if (!getRes.Item) {
    console.error(`Page with reference "${reference}" not found`);
    process.exit(1);
  }

  // 2. Generate a new nonce
  const newNonce = randomNonce();

  // 3. Update the page in DynamoDB
  await db.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { reference },
    UpdateExpression: 'SET nonce = :nonce',
    ExpressionAttributeValues: {
      ':nonce': newNonce
    },
    ExpressionAttributeNames: {
      '#ref': 'reference'
    },
    ConditionExpression: 'attribute_exists(#ref)'
  }));

  // 4. Compute the new management token
  const newToken = getPageToken(reference, newNonce);

  console.log('Token rotated successfully');
  console.log(`Reference: ${reference}`);
  console.log(`New Nonce: ${newNonce}`);
  console.log(`New Management Token: ${newToken}`);
  console.log('\nManagement URL:');
  console.log(`https://opkraambezoek.nl/page/${reference}/manage?token=${newToken}`);
}

const referenceArg = process.argv[2];
rotate(referenceArg).catch(err => {
  console.error('Failed to rotate token:', err);
  process.exit(1);
});
