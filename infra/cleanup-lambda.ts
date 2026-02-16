import { DynamoDBClient, ScanCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const region = process.env.AWS_REGION || "eu-west-1";
const tableName = process.env.DYNAMODB_TABLE || "VisitingHoursPage";
const bucketName = process.env.S3_BUCKET || "visiting-hours";

const dynamodb = new DynamoDBClient({ region });
const s3 = new S3Client({ region });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handler = async (event: any) => {
  console.log("Starting cleanup process...");

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // date_to is expected to be in YYYY-MM-DD format based on common patterns,
  // but we should be robust.
  const thresholdDateStr = ninetyDaysAgo.toISOString().split('T')[0];
  console.log(`Threshold date: ${thresholdDateStr}`);

  const isOld = (dateStr: string | undefined | null): boolean => {
    if (!dateStr || dateStr.trim() === "") {
      return true; // Blank date_to is considered old
    }

    let parsedDate: string;

    // Handle DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      parsedDate = `${year}-${month}-${day}`;
    } else {
      parsedDate = dateStr;
    }

    return parsedDate < thresholdDateStr;
  };

  let lastEvaluatedKey: Record<string, any> | undefined;
  let totalDeleted = 0;

  do {
    const scanCommand: ScanCommand = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
      // We scan and filter. Since it's only 1500 rows, this is fine.
    });

    const response = await dynamodb.send(scanCommand);
    const items = response.Items || [];

    for (const item of items) {
      const page = unmarshall(item);
      const dateTo = page.date_to;

      if (isOld(dateTo)) {
        console.log(`Deleting page ${page.reference} with date_to ${dateTo || '(blank)'}`);

        // Delete from S3 if image exists
        if (page.image) {
          try {
            await s3.send(new DeleteObjectCommand({
              Bucket: bucketName,
              Key: page.image,
            }));
            console.log(`Deleted image ${page.image} from S3`);
          } catch (err) {
            console.error(`Failed to delete image ${page.image} from S3`, err);
          }
        }

        // Delete from DynamoDB
        let deleted = false;
        let retries = 0;
        const maxRetries = 3;

        while (!deleted && retries <= maxRetries) {
          try {
            await dynamodb.send(new DeleteItemCommand({
              TableName: tableName,
              Key: marshall({ reference: page.reference }),
            }));
            totalDeleted++;
            deleted = true;
          } catch (err: any) {
            if (err.name === 'ProvisionedThroughputExceededException' && retries < maxRetries) {
              const delay = Math.pow(2, retries) * 1000;
              console.warn(`ProvisionedThroughputExceededException for ${page.reference}. Retrying in ${delay}ms...`);
              await sleep(delay);
              retries++;
            } else {
              console.error(`Failed to delete page ${page.reference} from DynamoDB`, err);
              break;
            }
          }
        }
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Cleanup finished. Total pages deleted: ${totalDeleted}`);
  return {
    statusCode: 200,
    body: JSON.stringify({ deleted: totalDeleted }),
  };
};
