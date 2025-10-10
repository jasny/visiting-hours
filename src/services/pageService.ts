'use server';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '@/lib/dynamodb';
import { Page, Slot } from "@/lib/types"
import { isTimeAvailable } from "@/lib/calendar"
import { randomNonce, randomString } from '@/lib/crypto';
import {
  clearVisitCookie,
  getPageCookie,
  getVisitCookie,
  setVisitCookie,
  verifyPageCookie,
  verifyVisitCookie,
  VisitCookie,
  setPageCookie
} from '@/lib/verification';
import { AccessDeniedError } from "@/lib/errors"
import {
  sendCancelVisitEmail,
  sendNewVisitEmail,
  sendRegisterEmail,
} from '@/services/emailService';

const TABLE_NAME = 'VisitingHoursPage';

async function fetchPage(reference: string, projection?: string): Promise<Page | undefined> {
  const res = await db.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { reference }, ProjectionExpression: projection})
  );

  return res.Item as unknown as Page | undefined;
}

export async function getPage(reference: string): Promise<Page & { manage_token?: string } | null> {
  const page = await fetchPage(reference);
  if (!page) return null;

  const manageToken = await getPageTokenForAdmin(page);

  delete page.nonce;
  if (!manageToken) delete page.email;

  for (const slot of page.slots) {
    if (!manageToken) delete slot.name;
    delete slot.nonce;
  }

  return manageToken ? { ...page, manage_token: manageToken } : page;
}

async function getPageTokenForAdmin(page: Pick<Page, 'reference' | 'nonce'>): Promise<string | null> {
  if (!page.nonce) {
    throw new Error('Page nonce is missing');
  }

  const token = await getPageCookie(page.reference);
  return token && verifyPageCookie(page.reference, token, page.nonce!) ? token : null;
}

export async function isAdmin(reference: string): Promise<boolean> {
  const token = await getPageCookie(reference);
  if (!token) return false;

  const page = await fetchPage(reference, 'nonce');
  if (!page) return false;

  return verifyPageCookie(reference, token, page.nonce!);
}

function findSlotForCookie(slots: Slot[], cookie: VisitCookie): Slot | undefined {
  return slots.find(
    (s) => (s.date === cookie.date && s.time === cookie.time && s.duration === cookie.duration),
  );
}

export async function getVisitFromCookie(reference: string): Promise<Slot | null> {
  const page = await fetchPage(reference, 'slots');
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

async function generateReference() {
  let reference = '';

  for (let i = 5; i >= 0; i--) {
    reference = randomString(8);
    const existing = await fetchPage(reference, 'reference');
    if (!existing) break;
  }

  if (reference === '') throw new Error('Failed to generate unique reference');

  return reference;
}

export async function createPage(page: Omit<Page, 'reference' | 'nonce' | 'slots'>): Promise<string> {
  const reference = await generateReference();
  const nonce = randomNonce();

  const item: Page = { ...page, reference, nonce } as Page;
  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  await setPageCookie(reference, nonce);

  await sendRegisterEmail(item);

  return reference;
}

export async function updatePage(page: Omit<Page, 'nonce' | 'slots'>): Promise<void> {
  const existing = await fetchPage(page.reference, 'nonce, slots');
  if (!existing) throw new Error('Failed to update page');

  if (!await getPageTokenForAdmin(existing)) {
    throw new AccessDeniedError();
  }

  const item: Page = { ...page, ...existing } as Page;
  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}

async function addSlot(page: Pick<Page, 'reference' | 'slots'>, slot: Slot): Promise<void> {
  const slots: Slot[] = page.slots ?? [];

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference: page.reference },
      UpdateExpression: 'SET slots = :v',
      ExpressionAttributeValues: { ':v': [...slots, slot] },
    })
  );
}

export async function addVisit(
  reference: string,
  payload: Omit<Slot, 'duration' | 'type' | 'nonce'>
): Promise<Slot | undefined> {
  const page = await fetchPage(reference);
  if (!page || !page.duration || !isTimeAvailable(page, payload.date, payload.time)) {
    console.log(`Could not add visit for ${reference}`)
    return;
  }

  const nonce = randomNonce();
  const visit: Slot = { ...payload, duration: page.duration, type: 'taken', nonce };

  await addSlot(page, visit);

  if (reference !== '') {
    const cookie = { date: visit.date, time: visit.time, duration: visit.duration };
    await setVisitCookie(reference, cookie, nonce);
  }

  if (page.nonce) {
    await sendNewVisitEmail(page, visit);
  }

  return { ...visit, nonce: undefined };
}

export async function cancelVisit(reference: string): Promise<boolean> {
  const page = await fetchPage(reference);
  if (!page) return false;

  const cookie = await getVisitCookie(reference);
  if (!cookie) return false;

  const slot = findSlotForCookie(page.slots, cookie);
  const isAllowed = Boolean(
    (slot?.nonce && !verifyVisitCookie(reference, cookie, slot.nonce))
      || await getPageTokenForAdmin(page)
  );

  if (!isAllowed) {
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

  if (slot && page.nonce) {
    await sendCancelVisitEmail(page, slot);
  }
  return true;
}

export async function addBlocked(
  reference: string,
  payload: Omit<Required<Slot>, 'type' | 'nonce'>
): Promise<void> {
  const page = await fetchPage(reference, 'slots, duration, nonce');
  if (!page) {
    console.log(`Could not add visit for ${reference}`)
    return;
  }

  if (!await getPageTokenForAdmin(page)) {
    throw new AccessDeniedError();
  }

  await addSlot(page, { ...payload, type: 'blocked' });
}
