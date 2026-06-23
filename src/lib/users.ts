import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Admin user store backed by DynamoDB (USERS_TABLE). Passwords are never stored
 * in plaintext: each user keeps a random salt and an scrypt hash.
 *
 * IMPORTANT: the scrypt parameters here must stay identical to
 * scripts/seed-users.mjs, which seeds the initial accounts.
 */

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-1';
const USERS_TABLE = process.env.USERS_TABLE || '';

export type AdminUser = {
  username: string;
  salt: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
};

export const hashPassword = (password: string): { salt: string; hash: string } => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
};

export const verifyPassword = (password: string, salt: string, hash: string): boolean => {
  try {
    const test = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, 'hex');
    return test.length === stored.length && timingSafeEqual(test, stored);
  } catch {
    return false;
  }
};

let docClientPromise: Promise<any> | null = null;
const getDocClient = async () => {
  if (!docClientPromise) {
    docClientPromise = (async () => {
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb');
      const client = new DynamoDBClient({ region: REGION });
      return DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });
    })();
  }
  return docClientPromise;
};

export const usersEnabled = () => Boolean(USERS_TABLE);

export const getUser = async (username: string): Promise<AdminUser | null> => {
  if (!USERS_TABLE) return null;
  const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
  const doc = await getDocClient();
  const result: any = await doc.send(new GetCommand({ TableName: USERS_TABLE, Key: { username } }));
  return (result.Item as AdminUser) || null;
};

export const listUsers = async (): Promise<Array<{ username: string; createdAt: string; updatedAt: string }>> => {
  if (!USERS_TABLE) return [];
  const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
  const doc = await getDocClient();
  const result: any = await doc.send(
    new ScanCommand({ TableName: USERS_TABLE, ProjectionExpression: 'username, createdAt, updatedAt' })
  );
  return ((result.Items as AdminUser[]) || [])
    .map((u) => ({ username: u.username, createdAt: u.createdAt, updatedAt: u.updatedAt }))
    .sort((a, b) => a.username.localeCompare(b.username));
};

export const upsertUser = async (username: string, password: string): Promise<void> => {
  if (!USERS_TABLE) throw new Error('USERS_TABLE not configured');
  const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
  const doc = await getDocClient();
  const existing = await getUser(username);
  const { salt, hash } = hashPassword(password);
  const now = new Date().toISOString();
  await doc.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        username,
        salt,
        hash,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      }
    })
  );
};

export const deleteUser = async (username: string): Promise<void> => {
  if (!USERS_TABLE) throw new Error('USERS_TABLE not configured');
  const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
  const doc = await getDocClient();
  await doc.send(new DeleteCommand({ TableName: USERS_TABLE, Key: { username } }));
};

export const authenticate = async (username: string, password: string): Promise<boolean> => {
  const user = await getUser(username);
  if (user) return verifyPassword(password, user.salt, user.hash);
  // Break-glass: if the user is not in the table but ADMIN_PASSWORD is set and
  // matches, allow it. Lets you recover access if the users table is ever empty.
  const fallback = process.env.ADMIN_PASSWORD || '';
  return Boolean(fallback) && password === fallback;
};
