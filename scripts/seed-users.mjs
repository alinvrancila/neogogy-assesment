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

const USERS = [
  { username: 'alin@neogogy.ai', password: 'Default123!' },
  { username: 'don@neogogy.ai', password: 'Default123!' },
  { username: 'lem@neogogy.ai', password: 'Default123!' }
];

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
console.log('done');
