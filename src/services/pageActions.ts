'use server';

import { savePage, addVisit, Page, Visit } from './pageService';

export async function createPage(page: Page) {
  await savePage(page);
}

export async function registerVisit(reference: string, visit: Omit<Visit, 'duration'>) {
  await addVisit(reference, visit);
}
