/*
  Seed Script - إنشاء حساب الأدمن الأول
   كيفية التشغيل (مرة وحدة فقط):
    npx ts-node -r tsconfig-paths/register seed-admin.ts
 
  تأكد إن ملف .env موجود وفيه DB_URL صح قبل التشغيل.
*/

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.join(__dirname, '.env') });

// ─── Schema (نسخة مبسطة للـ seed فقط) ───────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    password:   { type: String, required: true },
    email:      { type: String, required: true },
    nationalId: { type: String, required: true, unique: true },
    otp:        { type: String, default: '' },
    otpExpired: { type: Date,   default: new Date() },
    role:       { type: String, required: true },
    firstName:  { type: String },
    lastName:   { type: String },
  },
  { timestamps: true, discriminatorKey: 'role' },
);

const UserModel = mongoose.model('User', userSchema);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function validateNationalId(id: string): boolean {
  if (!/^\d{14}$/.test(id)) return false;
  if (id[0] !== '2' && id[0] !== '3') return false;
  const month = Number(id.substring(3, 5));
  const day   = Number(id.substring(5, 7));
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const DB_URL = process.env.DB_URL;
  if (!DB_URL) {
    console.error('ERROR: DB_URL is missing in .env file');
    process.exit(1);
  }

  console.log('\n==============================');
  console.log('  Creating Admin Account');
  console.log('==============================\n');

  const nationalId = await ask('National ID (14 digits): ');
  if (!validateNationalId(nationalId)) {
    console.error('ERROR: Invalid national ID (must be 14 digits starting with 2 or 3)');
    process.exit(1);
  }

  const email     = await ask('Email: ');
  const firstName = await ask('First Name: ');
  const lastName  = await ask('Last Name: ');
  const password  = await ask('Password (min 5 chars): ');

  if (password.length < 5) {
    console.error('ERROR: Password must be at least 5 characters');
    process.exit(1);
  }

  console.log('\nConnecting to database...');
  await mongoose.connect(DB_URL);
  console.log('Connected!');

  const existing = await UserModel.findOne({ nationalId });
  if (existing) {
    const r = (existing as any).role;
    console.error(`ERROR: Account already exists with this national ID (role: ${r})`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await UserModel.create({
    nationalId,
    email,
    firstName,
    lastName,
    password: hashedPassword,
    role: 'Admin',
    otp: '',
    otpExpired: new Date(),
  });

  console.log('\nAdmin account created successfully!');
  console.log('-----------------------------------');
  console.log('National ID : ' + nationalId);
  console.log('Email       : ' + email);
  console.log('Name        : ' + firstName + ' ' + lastName);
  console.log('Role        : Admin');
  console.log('-----------------------------------');
  console.log('You can now login at /admin-login\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
