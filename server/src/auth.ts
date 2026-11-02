import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { jwtVerify, SignJWT } from 'jose';

// ---------- Passwords: scrypt (built into Node, no native add-ons) ----------

const KEYLEN = 64;
const hashRaw = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => scrypt(password, salt, KEYLEN, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))));

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('base64')}$${(await hashRaw(password, salt)).toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await hashRaw(password, Buffer.from(salt, 'base64'));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------- Login tokens (JWT, 30 days) ----------

const DEV_SECRET = 'dev-only-secret-change-me-in-production';
function secret() {
  const s = process.env.JWT_SECRET ?? DEV_SECRET;
  if (process.env.NODE_ENV === 'production' && s === DEV_SECRET) throw new Error('Set JWT_SECRET in production');
  return new TextEncoder().encode(s);
}

export const issueToken = (userId: string) =>
  new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime('30d').sign(secret());

export type AuthEnv = { Variables: { userId: string } };

/** Requires "Authorization: Bearer <token>"; puts the user id on the context. */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) throw new Error('no subject');
    c.set('userId', payload.sub);
  } catch {
    throw new HTTPException(401, { message: 'Please log in again' });
  }
  await next();
});

// ---------- Simple brute-force guard for login/sign-up ----------

const hits = new Map<string, { n: number; reset: number }>();
export const rateLimit = (max: number, windowMs: number) =>
  createMiddleware(async (c, next) => {
    const key = (c.req.header('x-forwarded-for') ?? 'local').split(',')[0].trim() + c.req.path;
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) hits.set(key, { n: 1, reset: now + windowMs });
    else if (++h.n > max) throw new HTTPException(429, { message: 'Too many attempts, try again in a minute' });
    await next();
  });
