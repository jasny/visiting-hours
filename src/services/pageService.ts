'use server';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '@/lib/dynamodb';
import { Page, Slot } from "@/lib/types"
import { isTimeAvailable } from "@/lib/calendar"
import crypto from 'crypto';
import {
  clearVisitCookie,
  getVisitCookie,
  setVisitCookie,
  verifyVisitCookie, VisitCookie
} from '@/lib/verification';

const TABLE_NAME = 'VisitingHoursPage';

async function fetchPage(reference: string): Promise<Page | undefined> {
  const res = await db.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { reference }})
  );

  return res.Item as unknown as Page | undefined;
}

export async function getPage(reference: string): Promise<Page | null> {
  const page = await fetchPage(reference);
  if (!page) return null;

  delete page.email;
  delete page.nonce;

  for (const slot of page.slots) {
    delete slot.name;
    delete slot.nonce;
  }

  return page;
}

function findSlotForCookie(slots: Slot[], cookie: VisitCookie): Slot | undefined {
  return slots.find(
    (s) => (s.date === cookie.date && s.time === cookie.time && s.duration === cookie.duration),
  );
}

export async function getVisitFromCookie(reference: string): Promise<Slot | null> {
  const page = await fetchPage(reference);
  if (!page) return null;

  const cookie = await getVisitCookie(reference);
  if (!cookie) return null;

  const { nonce, ...slot } = findSlotForCookie(page.slots, cookie) ?? {};

  if (!nonce || !verifyVisitCookie(reference, cookie, nonce)) {
    console.error(`Failed to verify cookie for ${reference}`, cookie, slot, nonce);
    return null;
  }

  return slot as Slot;
}

export async function savePage(page: Page): Promise<void> {
  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: page }));
}

export async function addVisit(
  reference: string,
  payload: Omit<Required<Slot>, 'duration' | 'type' | 'nonce'>
): Promise<Slot | undefined> {
  const page = await fetchPage(reference);
  if (!page || !page.duration || !isTimeAvailable(page, payload.date, payload.time)) {
    console.log(`Could not add visit for ${page?.reference ?? 'unknown page'}`)
    return;
  }

  const slots: Slot[] = page.slots ?? [];
  const nonce = crypto.randomBytes(16).toString('hex');
  const visit: Required<Slot> = { ...payload, duration: page.duration, type: 'taken', nonce };

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      UpdateExpression: 'SET slots = :v',
      ExpressionAttributeValues: { ':v': [...slots, visit] },
    })
  );

  if (reference !== '') {
    const cookie = { date: visit.date, time: visit.time, duration: visit.duration };
    await setVisitCookie(reference, cookie, nonce);
  }

  return { ...visit, nonce: undefined };
}

export async function cancelVisit(reference: string): Promise<boolean> {
  const page = await fetchPage(reference);
  if (!page) return false;

  const cookie = await getVisitCookie(reference);
  if (!cookie) return false;

  const slot = findSlotForCookie(page.slots, cookie);

  if (!slot?.nonce || !verifyVisitCookie(reference, cookie, slot.nonce)) {
    console.error(`Failed to verify cookie for ${reference}`, cookie, slot);
    return false;
  }

  const newSlots = page.slots.filter((s) => s !== slot);

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
