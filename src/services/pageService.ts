'use server';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '@/lib/dynamodb';
import { Page, Slot } from "@/lib/types"

const TABLE_NAME = 'VisitingHoursPage';

export async function getPage(reference: string): Promise<Page | null> {
  const res = await db.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { reference } })
  );
  const raw = res.Item as Record<string, unknown> | undefined;
  if (!raw) return null;
  // Backward-compat: migrate JSON-string visits to Document list on read
  if (typeof raw.visits === 'string') {
    try {
      raw.visits = JSON.parse(raw.visits);
    } catch {
      raw.visits = [];
    }
  }
  return raw as unknown as Page;
}

export async function savePage(page: Page): Promise<void> {
  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: page }));
}

export async function addVisit(
  reference: string,
  visit: Omit<Slot, 'duration' | 'state'>
): Promise<Slot | null> {
  const page = await getPage(reference);
  if (!page || !page.duration) return null;
  const visits: Slot[] = page.slots ?? [];
  const newVisit: Slot = { ...visit, duration: page.duration, state: 'taken' };
  visits.push(newVisit);
  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      UpdateExpression: 'SET visits = :v',
      ExpressionAttributeValues: { ':v': visits },
    })
  );
  return newVisit;
}
