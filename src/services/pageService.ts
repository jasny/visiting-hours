'use server';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from './dynamodb';

export interface Visit {
  date: string;
  time: string;
  name: string;
  duration: number;
}

export interface Page {
  reference: string;
  email?: string;
  name?: string;
  date_of_birth?: string;
  parent_name?: string;
  street?: string;
  postalcode?: string;
  city?: string;
  description?: string;
  gifts?: string;
  contact?: string;
  date_from?: string;
  date_to?: string | null;
  morning_from?: string | null;
  morning_to?: string | null;
  morning_amount?: number | null;
  afternoon_from?: string | null;
  afternoon_to?: string | null;
  afternoon_amount?: number | null;
  evening_from?: string | null;
  evening_to?: string | null;
  evening_amount?: number | null;
  duration?: number | null;
  visits?: string | null;
  manage_token?: string;
  prepare?: boolean;
}

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
