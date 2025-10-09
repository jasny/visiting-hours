'use server';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '@/lib/dynamodb';
import { Page, Slot } from "@/lib/types"
import { isTimeAvailable } from "@/lib/calendar"
import crypto from 'crypto';
import {
  clearVisitCookie,
  computeVisitVerification,
  setVisitCookie,
  verifyVisitCookie
} from '@/lib/verification';

const TABLE_NAME = 'VisitingHoursPage';

export async function getPage(reference: string): Promise<Page | null> {
  const res = await db.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { reference } })
  );
  const page = res.Item as Page | undefined;
  if (!page) return null;

  for (const slot of page.slots) {
    delete slot.name;
    delete slot.nonce;
  }

  return page;
}

export async function getVisitFromCookie(reference: string): Promise<Slot | null> {
  const cookie = await verifyVisitCookie(reference);
  if (!cookie) return null;

  const { verification: _v, nonce: _n, ...slot } = cookie;

  return { ...slot, type: 'taken' as const };
}

export async function savePage(page: Page): Promise<void> {
  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: page }));
}

export async function addVisit(
  reference: string,
  payload: Omit<Required<Slot>, 'duration' | 'type' | 'nonce'>
): Promise<Slot | undefined> {
  const page = await getPage(reference);
  if (!page || !page.duration || !isTimeAvailable(page, payload.date, payload.time)) {
    console.log(`Could not add visit for ${page?.reference ?? 'unknown page'}`)
    return;
  }

  const slots: Slot[] = page.slots ?? [];
  const nonce = crypto.randomBytes(16).toString('hex');
  const visit: Required<Slot> = { ...payload, duration: page.duration, type: 'taken', nonce };
  slots.push(visit);

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      UpdateExpression: 'SET slots = :v',
      ExpressionAttributeValues: { ':v': slots },
    })
  );

  if (reference === '') {
    const verification = computeVisitVerification(reference, visit.date, visit.time);
    await setVisitCookie(reference, { ...visit, verification, nonce });
  }

  return { ...visit, nonce: undefined };
}

export async function cancelVisit(reference: string): Promise<boolean> {
  const page = await getPage(reference);
  if (!page) return false;

  const cookie = await verifyVisitCookie(reference);
  if (!cookie) return false;

  const oldSlots: Slot[] = page.slots ?? [];

  const newSlots = oldSlots.filter(
    (s) => !(s.date === cookie.date && s.time === cookie.time && s.nonce === cookie.nonce)
  );
  if (oldSlots.length === newSlots.length) {
    return false;
  }

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      UpdateExpression: 'SET slots = :v',
      ExpressionAttributeValues: { ':v': newSlots },
    })
  );

  await clearVisitCookie(reference);
  return true;
}
