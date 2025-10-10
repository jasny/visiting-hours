import path from 'node:path';
import nodemailer from 'nodemailer';
import { convert } from 'html-to-text';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { fromTokenFile } from '@aws-sdk/credential-providers';
import { createEnvironment, createFilter, createFilesystemLoader } from 'twing';
import { getPageToken } from '@/lib/verification';
import type { Page, Slot } from '@/lib/types';
import * as fs from "fs";

type TemplateName = 'register' | 'new-visit' | 'cancel-visit';

const EMAIL_FROM = process.env.EMAIL_FROM || 'info@opkraambezoek.nl';
const BASE_URL =
  process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';

const loader = createFilesystemLoader(fs);
loader.addPath(path.join(process.cwd(), 'src'));

const twing = createEnvironment(loader);

const localDateFilter = createFilter(
  'localdate',
  async (
    _context,
    value?: string,
    style: Intl.DateTimeFormatOptions['dateStyle'] = 'long',
  ): Promise<string> => {
    if (!value) return '';

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return value;

    const date = new Date(Date.UTC(year, month - 1, day));
    const formatter = new Intl.DateTimeFormat('nl-NL', {
      dateStyle: style,
      timeZone: 'Europe/Amsterdam',
    });

    return formatter.format(date);
  },
  [
    { name: 'value' },
    { name: 'style', defaultValue: 'long' },
  ],
);

function compilePattern(pattern: string): RegExp {
  if (pattern.startsWith('/')) {
    const lastSlash = pattern.lastIndexOf('/');
    if (lastSlash > 0) {
      const body = pattern.slice(1, lastSlash);
      const flags = pattern.slice(lastSlash + 1);
      return new RegExp(body, flags);
    }
  }

  return new RegExp(pattern);
}

const pregMatchFilter = createFilter(
  'preg_match',
  async (_context, value: string, pattern: string): Promise<boolean> => {
    try {
      return compilePattern(pattern).test(value);
    } catch {
      return false;
    }
  },
  [
    { name: 'value' },
    { name: 'pattern' },
  ],
);

twing.addFilter(localDateFilter);
twing.addFilter(pregMatchFilter);

const credentials =
  process.env.NODE_ENV === 'production'
    ? fromTokenFile({
        roleArn: process.env.AWS_ROLE_ARN!,
        webIdentityTokenFile: process.env.AWS_WEB_IDENTITY_TOKEN_FILE!,
      })
    : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
      };

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transporter = nodemailer.createTransport({ SES: { sesClient, SendEmailCommand }} as any);

function buildInfo(page: Page) {
  const manageToken = getPageToken(page.reference, page.nonce!);
  let link: string;

  try {
    link = new URL(`/page/${page.reference}`, BASE_URL).toString();
  } catch {
    const base = BASE_URL.replace(/\/$/, '');
    link = `${base}/page/${page.reference}`;
  }

  return {
    parent_name: page.parent_name,
    name: page.name,
    manage_token: manageToken,
    link,
  };
}

function buildVisit(slot: Slot) {
  const [hour, minute] = slot.time.split(':').map(Number);
  const start = new Date(Date.UTC(1970, 0, 1, hour ?? 0, minute ?? 0));
  start.setUTCMinutes(start.getUTCMinutes() + slot.duration);

  const hh = start.getUTCHours().toString().padStart(2, '0');
  const mm = start.getUTCMinutes().toString().padStart(2, '0');

  return {
    name: slot.name ?? '',
    date: slot.date,
    time: slot.time,
    time_until: `${hh}:${mm}`,
  };
}

async function renderTemplate(
  template: TemplateName,
  context: Record<string, unknown>,
): Promise<{ html: string; text: string }> {
  const html = await twing.render(`email/${template}.html.twig`, context);
  const text = convert(html, {
    selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }],
    wordwrap: 120,
  });

  return { html, text };
}

async function sendTemplate(
  template: TemplateName,
  to: string | undefined,
  subject: string,
  context: Record<string, unknown>,
) {
  if (!to) return;

  try {
    const { html, text } = await renderTemplate(template, context);
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error(`Failed to send ${template} email`, error);
  }
}

export async function sendRegisterEmail(page: Page) {
  await sendTemplate('register', page.email, `De kraambezoekpagina van ${page.name}`, {
    info: buildInfo(page),
  });
}

export async function sendNewVisitEmail(page: Page, visit: Slot) {
  const guestName = visit.name!;
  await sendTemplate(
    'new-visit',
    page.email,
    `${guestName} wil op kraambezoek komen`,
    {
      info: buildInfo(page),
      visit: buildVisit(visit),
    },
  );
}

export async function sendCancelVisitEmail(page: Page, visit: Slot) {
  const guestName = visit.name!;
  await sendTemplate(
    'cancel-visit',
    page.email,
    `Bezoek van ${guestName} geannuleerd`,
    {
      info: buildInfo(page),
      visit: buildVisit(visit),
    },
  );
}

