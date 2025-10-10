'use server';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { buildUpdateExpression, db } from '@/lib/dynamodb';
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
    const existing = await fetchPage(reference, 'nonce');
    if (!existing) break;
  }

  if (reference === '') throw new Error('Failed to generate unique reference');

  return reference;
}

export async function savePage(page: Omit<Page, 'reference' | 'nonce' | 'slots'> & { reference?: string }): Promise<string> {
  let item: Page;

  if (page.reference) {
    const existing = await fetchPage(page.reference, 'nonce, slots, theme, image');
    if (!existing) throw new Error('Failed to update page');

    if (!await getPageTokenForAdmin({ ...existing, reference: page.reference })) {
      throw new AccessDeniedError();
    }

    item = { ...page, ...existing };
  } else {
    const reference = await generateReference();
    const nonce = randomNonce();
    item = { ...page, reference, nonce, slots: [] };
  }

  await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  await setPageCookie(item.reference, item.nonce!);

  return item.reference;
}

export async function updatePage(reference: string, payload: Partial<Omit<Page, 'reference' | 'slots'>>) {
  if (!await isAdmin(reference)) throw new AccessDeniedError();

  const update = buildUpdateExpression(payload);

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      ...update,
      ReturnValues: "NONE",
    })
  );
}

async function _addSlot(page: Pick<Page, 'reference' | 'slots'>, slot: Slot): Promise<void> {
  const slots: Slot[] = page.slots ?? [];

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference: page.reference },
      UpdateExpression: 'SET slots = :v',
      ExpressionAttributeValues: { ':v': [...slots, slot] },
      ReturnValues: "NONE",
    })
  );
}

export async function addVisit(
  reference: string,
  payload: Omit<Slot, 'duration' | 'type' | 'nonce'>
): Promise<Slot | undefined> {
  const page = await fetchPage(reference, 'slots, duration');
  if (!page || !page.duration || !isTimeAvailable(page, payload.date, payload.time)) {
    console.log(`Could not add visit for ${reference}`)
    return;
  }

  const nonce = randomNonce();
  const visit: Slot = { ...payload, duration: page.duration, type: 'taken', nonce };

  await _addSlot(page, visit);

  if (reference !== '') {
    const cookie = { date: visit.date, time: visit.time, duration: visit.duration };
    await setVisitCookie(reference, cookie, nonce);
  }

  return { ...visit, nonce: undefined };
}

export async function cancelVisit(reference: string): Promise<boolean> {
  const page = await fetchPage(reference, 'slots');
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
  return true;
}

export async function addSlot(
  reference: string,
  payload: Omit<Required<Slot>, 'nonce'>
): Promise<void> {
  const page = await fetchPage(reference, 'slots, nonce');
  if (!page) {
    console.log(`Could not add visit for ${reference}`)
    return;
  }

  if (!await getPageTokenForAdmin(page)) {
    throw new AccessDeniedError();
  }

  await _addSlot(page, payload);
}
