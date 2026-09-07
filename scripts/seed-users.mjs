// Seed the admin users table. Run locally with AWS creds in the environment:
//   node scripts/seed-users.mjs
// scrypt params MUST match src/lib/users.ts.
import { randomBytes, scryptSync } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'ap-southeast-1';
const TABLE = process.env.USERS_TABLE || 'neogogy-users';

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
};

/**
 * Who to seed. Passwords are generated here and printed once, never written
 * down in this file.
 *
 * This script used to carry one shared literal for all three accounts, which
 * then also appeared in DEPLOY.md, in the repository, against a live dashboard
 * holding every respondent's personal data. A password that lives in version
 * control is not a password.
 */
const NAMES = (process.env.SEED_USERS || 'alin@neogogy.ai,don@neogogy.ai,lem@neogogy.ai')
  .split(',').map((n) => n.trim().toLowerCase()).filter(Boolean);

/** 18 random bytes, base64url: long enough that nobody is tempted to reuse it. */
const newPassword = () => randomBytes(18).toString('base64url');

const USERS = NAMES.map((username) => ({ username, password: newPassword() }));

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

for (const u of USERS) {
  const { salt, hash } = hashPassword(u.password);
  const now = new Date().toISOString();
  await doc.send(
    new PutCommand({
      TableName: TABLE,
      Item: { username: u.username, salt, hash, createdAt: now, updatedAt: now }
    })
  );
  console.log('seeded', u.username);
}

console.log('\nOne-time passwords. Copy them now, out of band, and change them');
console.log('in the Admin users panel after first sign in. They are not stored');
console.log('anywhere else and this is the only time they are shown.\n');
for (const u of USERS) console.log(`  ${u.username.padEnd(24)} ${u.password}`);
console.log('\ndone');
