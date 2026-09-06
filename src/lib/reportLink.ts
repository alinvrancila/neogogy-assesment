/**
 * The report link (audit item B3).
 *
 * A stored result has its own web address. The address carries a long random
 * token rather than the record's identifier, so a link cannot be guessed, and
 * one link cannot be walked into another.
 *
 * The token is stored in full rather than as a hash, because the privacy notice
 * promises a control that sends the existing link to the address on file, and a
 * hash cannot be turned back into a link. The tradeoff is deliberate and it is
 * the reason the token is kept out of exports, out of analytics, and out of the
 * logs: the database is the only place it lives.
 *
 * Lifetime is not its own policy. The link works for exactly as long as the
 * record does, twenty four months from the person's last completed assessment,
 * so a respondent can never hold a live link to a deleted result or find a dead
 * link to a result still held.
 */
import type { Metadata } from 'next';
import { randomBytes, timingSafeEqual } from 'crypto';
import { BRAND } from '@/brand';

/** Where report pages live. Kept here so the route, the tests, the headers and
 *  the nginx rule all read the same string. */
export const REPORT_PREFIX = '/r';

/** Retention, and therefore link lifetime, in months. Stated in the notice. */
export const RETENTION_MONTHS = 24;

/** 256 bits. A token this size is not enumerable at any rate a web server
 *  would survive, so the link needs no second factor to be private. */
export const TOKEN_BYTES = 32;

/** base64url of 32 bytes is always 43 characters, with no padding. */
export const TOKEN_LENGTH = 43;

const TOKEN_SHAPE = new RegExp(`^[A-Za-z0-9_-]{${TOKEN_LENGTH}}$`);

/** A fresh, unguessable token. */
export const mintReportToken = (): string => randomBytes(TOKEN_BYTES).toString('base64url');

/**
 * Whether a string could be a token at all.
 *
 * Checked before the database is touched, so a scan is never run for a value
 * that could not possibly match, and so nothing shaped like a path or a script
 * reaches the lookup.
 */
export const isWellFormedToken = (value: unknown): value is string =>
  typeof value === 'string' && TOKEN_SHAPE.test(value);

/** Compare two tokens without leaking their agreement through timing. */
export function tokensMatch(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a, 'utf-8');
  const right = Buffer.from(b, 'utf-8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** The public origin. Overridable so a link opened in development points at
 *  the machine it was made on rather than at production. */
export const siteOrigin = (): string =>
  (process.env.PUBLIC_BASE_URL || BRAND.url).replace(/\/+$/, '');

export const reportPath = (token: string): string => `${REPORT_PREFIX}/${token}`;

export const reportUrl = (token: string): string => `${siteOrigin()}${reportPath(token)}`;

/**
 * Twenty four months after an instant.
 *
 * Clamped to the last day of the target month, so a sitting on 31 August
 * expires on 31 August and a sitting on 29 February expires on 28 February
 * rather than rolling forward into March.
 */
export function expiresAt(from: string | Date): Date {
  const start = from instanceof Date ? new Date(from.getTime()) : new Date(from);
  if (Number.isNaN(start.getTime())) return new Date(NaN);

  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + RETENTION_MONTHS;
  const lastDayOfTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(start.getUTCDate(), lastDayOfTarget);

  return new Date(Date.UTC(
    year, month, day,
    start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds()
  ));
}

/**
 * Whether a link is still live.
 *
 * `lastCompletedAt` is the person's most recent completed assessment, not this
 * record's own date. Taking the assessment again restarts retention for
 * everything held about them, and the notice says the link goes with it.
 */
export function isLive(lastCompletedAt: string | Date | undefined | null, now: Date = new Date()): boolean {
  if (!lastCompletedAt) return false;
  const ends = expiresAt(lastCompletedAt);
  if (Number.isNaN(ends.getTime())) return false;
  return now.getTime() < ends.getTime();
}

/** Whole days left, floored, never below zero. For copy on the page. */
export function daysRemaining(lastCompletedAt: string | Date, now: Date = new Date()): number {
  const ends = expiresAt(lastCompletedAt);
  if (Number.isNaN(ends.getTime())) return 0;
  const ms = ends.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.floor(ms / 86400000);
}

/**
 * Remove any report token from a string before it is written down.
 *
 * Used on every path, referrer and error message that reaches an event record,
 * a stored field or the console. The notice promises the token is stripped
 * before anything is written to analytics or to the logs, and this is where
 * that promise is kept.
 */
export function redactToken(value: string): string;
export function redactToken(value: undefined): undefined;
export function redactToken(value: string | undefined): string | undefined;
export function redactToken(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.replace(
    new RegExp(`(${REPORT_PREFIX}/)[A-Za-z0-9_-]{${TOKEN_LENGTH},}`, 'g'),
    '$1[token]'
  );
}

/** Show an address back to the person who owns it without printing it in full. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return 'the address on your record';
  const name = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = name.slice(0, 1);
  const tail = name.length > 2 ? name.slice(-1) : '';
  return `${head}${'*'.repeat(Math.max(1, name.length - head.length - tail.length))}${tail}@${domain}`;
}

/**
 * What a report page tells a crawler, a cache and a browser about itself.
 *
 * Kept here rather than in the route so it can be read by a test without
 * dragging a React page and its stylesheet along with it. The route exports
 * this object as its own metadata, which is what Next.js renders from.
 */
export const REPORT_PAGE_METADATA: Metadata = {
  // Nothing about a private report belongs in an index or a cache.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  // The address carries the token, so it is never handed to a site the reader
  // clicks through to. The response also sets Referrer-Policy: no-referrer,
  // because a meta tag is not read by a browser that never renders the page.
  referrer: 'no-referrer',
  // The root layout gives every page the site's share card, a description and a
  // canonical pointing at the homepage. None of that should follow a private
  // address around: a link pasted into a chat would otherwise unfurl into a
  // branded card, which invites the paste rather than discouraging it, and the
  // canonical would quietly tell a crawler that this page is the homepage.
  // Nulling them here replaces the inherited tags rather than adding to them.
  openGraph: null,
  twitter: null,
  description: null,
  alternates: { canonical: null },
};
