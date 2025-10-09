'use server';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '@/lib/dynamodb';
import { Page, Slot } from "@/lib/types"
import { buildCalendar, isTimeAvailable } from "@/lib/calendar"

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
      raw.slots = JSON.parse(raw.visits);
    } catch {}
  }

  return raw as unknown as Page;
}

export async function savePage(page: Page): Promise<void> {
  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: page }));
}

export async function addVisit(
  reference: string,
  visit: Omit<Slot, 'duration' | 'type'>
): Promise<Slot | undefined> {
  const page = await getPage(reference);
  if (!page || !page.duration || !isTimeAvailable(page, visit.date, visit.time)) {
    console.log(`Could not add visit for ${page?.reference ?? 'unknown page'}`)
    return;
  }

  const slots: Slot[] = page.slots ?? [];
  const newVisit: Slot = { ...visit, duration: page.duration, type: 'taken' };
  slots.push(newVisit);

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      UpdateExpression: 'SET slots = :v',
      ExpressionAttributeValues: { ':v': slots },
    })
  );
  return newVisit;
}

export async function cancelVisit(
  reference: string,
  visit: Pick<Slot, 'date' | 'time' | 'name'>
): Promise<boolean> {
  const page = await getPage(reference);
  if (!page) return false;
  const slots: Slot[] = page.slots ?? [];
  const before = slots.length;
  const next = slots.filter(
    (s) => !(s.date === visit.date && s.time === visit.time && s.name === visit.name)
  );
  if (next.length === before) {
    // nothing removed
    return false;
  }
  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      UpdateExpression: 'SET slots = :v',
      ExpressionAttributeValues: { ':v': next },
    })
  );
  return true;
}
