const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const p = new PrismaClient();

const PREFIX = `KMD-${new Date().getFullYear()}-`;
const TEST_COUNT = 10;
const MAX_RETRIES = 15;

async function getNextReceiptNumber() {
  const maxResult = await p.donation.findFirst({
    where: { receiptNumber: { startsWith: PREFIX } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });
  let nextNum = 1;
  if (maxResult) {
    const suffix = maxResult.receiptNumber.slice(PREFIX.length);
    nextNum = parseInt(suffix, 10) + 1;
  }
  return `${PREFIX}${String(nextNum).padStart(6, '0')}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function createDonation(idx) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const receiptNumber = await getNextReceiptNumber();
    const orderId = randomUUID();
    try {
      await p.donation.create({
        data: {
          receiptNumber,
          donorName: `ConcurrentUser${idx}`,
          mobile: `98${String(idx).padStart(8, '0')}`,
          amount: 100 + idx,
          currency: 'INR',
          paymentMethod: 'UPI',
          paymentOrderId: orderId,
          paymentStatus: 'PENDING',
        },
      });
      const note = `मंदिर निर्माण हेतु दान - ${receiptNumber}`;
      const upiLink = `upi://pay?pa=test&pn=test&am=100&cu=INR&tn=${encodeURIComponent(note)}`;
      return { receiptNumber, upiLink };
    } catch (err) {
      if (err.code === 'P2002') {
        // Jittered backoff matching production code
        await sleep(5 + Math.random() * 15);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed after ${MAX_RETRIES} retries for idx=${idx}`);
}

async function test() {
  console.log(`Running ${TEST_COUNT} simultaneous donation creations...\n`);
  const promises = [];
  for (let i = 0; i < TEST_COUNT; i++) {
    promises.push(createDonation(i));
  }
  const results = await Promise.all(promises);

  const receiptNumbers = results.map(r => r.receiptNumber);
  const unique = new Set(receiptNumbers);

  console.log('Generated IDs:', receiptNumbers);
  console.log('Unique count:', unique.size, '/', receiptNumbers.length);
  console.log('ALL UNIQUE:', unique.size === receiptNumbers.length ? 'PASS' : 'FAIL');

  // Verify all persisted
  const dbRecords = await p.donation.findMany({
    where: { receiptNumber: { in: receiptNumbers } },
    select: { receiptNumber: true, paymentStatus: true },
  });
  console.log('Persisted in DB:', dbRecords.length, '/', TEST_COUNT);
  console.log('ALL PERSISTED:', dbRecords.length === TEST_COUNT ? 'PASS' : 'FAIL');

  // Verify UPI tn correctness
  let tnOk = true;
  for (const r of results) {
    if (!r.upiLink.includes(encodeURIComponent(r.receiptNumber))) {
      console.log('TN MISMATCH:', r.receiptNumber);
      tnOk = false;
    }
  }
  console.log('UPI TN CORRECT:', tnOk ? 'PASS' : 'FAIL');

  // Verify sequential (no gaps within the new batch)
  const nums = receiptNumbers.map(r => parseInt(r.split('-')[2], 10)).sort((a, b) => a - b);
  const noGaps = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  console.log('SEQUENTIAL (no gaps):', noGaps ? 'PASS' : 'FAIL');

  // Cleanup test records
  await p.donation.deleteMany({
    where: { receiptNumber: { in: receiptNumbers } },
  });
  console.log('\nCleaned up test records.');

  // Verify existing records untouched
  const remaining = await p.donation.findMany({
    orderBy: { receiptNumber: 'asc' },
    select: { receiptNumber: true },
  });
  console.log('Existing records preserved:', remaining.length === 9 ? 'PASS' : 'FAIL');
  console.log('Records:', remaining.map(r => r.receiptNumber).join(', '));

  await p.$disconnect();
}

test().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });
