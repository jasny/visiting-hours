'use server';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '@/lib/dynamodb';
import { Page, Visit } from "@/lib/types"

const TABLE_NAME = 'VisitingHoursPage';

export async function getPage(reference: string): Promise<Page | null> {
  const res = await db.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { reference } })
  );
  return (res.Item as Page) || null;
}

export async function savePage(page: Page): Promise<void> {
  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: page }));
}

export async function addVisit(
  reference: string,
  visit: Omit<Visit, 'duration'>
): Promise<Visit | null> {
  const page = await getPage(reference);
  if (!page || !page.duration) return null;
  const visits: Visit[] = page.visits ? JSON.parse(page.visits) : [];
  const newVisit: Visit = { ...visit, duration: page.duration };
  visits.push(newVisit);
  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      UpdateExpression: 'SET visits = :v',
      ExpressionAttributeValues: { ':v': JSON.stringify(visits) },
    })
  );
  return newVisit;
}
