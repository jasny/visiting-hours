'use server';

import { GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { buildUpdateExpression, db } from '@/lib/dynamodb';
import { Page, Slot } from "@/lib/types"
import { isTimeAvailable } from "@/lib/calendar"
import { randomNonce, randomString } from '@/lib/crypto';
import {
  clearVisitCookie,
  getPageCookie,
  getVisitCookie,
  setVisitCookie,
  verifyPageToken,
  verifyVisitCookie,
  VisitCookie,
  setPageCookie
} from '@/lib/verification';
import { AccessDeniedError } from "@/lib/errors"
import {
  sendCancelVisitEmail,
  sendNewVisitEmail,
  sendRegisterEmail,
} from '@/lib/email';
import { credentials } from '@/lib/aws';

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'VisitingHoursPage';

async function fetchPage(reference: string, projection?: string): Promise<Page | undefined> {
  const res = await db.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { reference }, ProjectionExpression: projection})
  );

  const data = res.Item;
  if (data && !('reference' in data)) data.reference = reference;

  return data as unknown as Page | undefined;
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
  return token && verifyPageToken(page.reference, token, page.nonce!) ? token : null;
}

export async function isAdmin(reference: string): Promise<boolean> {
  const token = await getPageCookie(reference);
  if (!token) return false;

  const page = await fetchPage(reference, 'nonce');
  if (!page) return false;

  return verifyPageToken(reference, token, page.nonce!);
}

export async function acceptManageToken(reference: string, token: string): Promise<boolean> {
  const page = await fetchPage(reference, 'nonce');
  if (!page || !page.nonce) return false;

  return verifyPageToken(reference, token, page.nonce);
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

    if (!await getPageTokenForAdmin(existing)) {
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
  await sendRegisterEmail(item);

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
  const page = await fetchPage(reference);
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

  await sendNewVisitEmail(page, visit);

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

  if (slot) {
    await sendCancelVisitEmail(page, slot);
  }
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

export async function removeSlot(
  reference: string,
  slot: Omit<Slot, 'nonce'>
): Promise<boolean> {
  const page = await fetchPage(reference, 'slots, nonce');
  if (!page) return false;

  if (!await getPageTokenForAdmin(page)) {
    throw new AccessDeniedError();
  }

  const newSlots = (page.slots ?? []).filter((s) => !(
    s.date === slot.date &&
    s.time === slot.time &&
    s.duration === slot.duration &&
    s.type === slot.type
  ));

  if (newSlots.length === (page.slots ?? []).length) {
    // nothing removed
    return false;
  }

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { reference },
      UpdateExpression: 'SET slots = :v',
      ExpressionAttributeValues: { ':v': newSlots },
      ReturnValues: 'NONE',
    })
  );

  return true;
}

export async function deletePage(reference: string): Promise<boolean> {
  // Ensure the user is admin via the page cookie/token
  if (!await isAdmin(reference)) {
    throw new AccessDeniedError();
  }

  // Fetch page to know if there is an image to delete
  const page = await fetchPage(reference, 'image');

  // Attempt to delete the image from S3 first (best-effort)
  const bucket = process.env.S3_BUCKET as string | undefined;
  const region = process.env.AWS_REGION || 'eu-west-1';
  if (bucket && page?.image) {
    try {
      const s3 = new S3Client({ region, credentials });
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: page.image,
        })
      );
    } catch (err) {
      console.error('Failed to delete image from S3 for page', reference, page?.image, err);
      // continue: we still want to delete the page record
    }
  }

  // Delete the page record from DynamoDB
  await db.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { reference },
    })
  );

  return true;
}
