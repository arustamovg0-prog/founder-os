import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Verify admin credentials
const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_JSON;
let hasCreds = false;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    hasCreds = true;
  } catch (e) {
    console.error('Invalid FIREBASE_ADMIN_SDK_JSON');
  }
} else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
  hasCreds = true;
}

if (!hasCreds) {
  console.error('\n❌ Missing Firebase Admin Credentials.');
  console.error('To seed the database, you must configure Service Account credentials in .env.local:');
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('- FIREBASE_ADMIN_CLIENT_EMAIL');
  console.error('- FIREBASE_ADMIN_PRIVATE_KEY\n');
  process.exit(1);
}

const db = admin.firestore();

const MOCK_STARTUPS = [
  {
    id: "startup-demo-1",
    name: "UzbekFin",
    industry: "FinTech",
    stage: "investment_ready",
    tagline: "Neo-banking for SME in Central Asia",
    founderIds: ["founder-demo-user-id"],
    metrics: {
      mrr: 15000,
      users: 12000,
      ltvCacRatio: 3.5,
      runwayMonths: 8,
      teamSize: 12
    },
    aiScores: {
      pitchDeck: 85,
      marketFit: 78,
      traction: 82,
      team: 90,
      overallReadinessScore: 84
    },
    dataRoom: {
      pitchDeckUrl: "#",
      financialModelUrl: "#"
    }
  },
  {
    id: "startup-demo-2",
    name: "AgroUz",
    industry: "AgriTech",
    stage: "growth",
    tagline: "Smart irrigation using IoT",
    founderIds: [],
    metrics: {
      mrr: 4500,
      users: 150,
      ltvCacRatio: 2.1,
      runwayMonths: 4,
      teamSize: 5
    },
    aiScores: {
      pitchDeck: 70,
      marketFit: 85,
      traction: 60,
      team: 75,
      overallReadinessScore: 72
    },
    dataRoom: {
      pitchDeckUrl: "#"
    }
  }
];

async function seed() {
  console.log('🌱 Seeding database...');
  for (const s of MOCK_STARTUPS) {
    await db.collection('startups').doc(s.id).set(s);
    console.log(`✅ Seeded startup: ${s.name}`);
  }
  console.log('🎉 Seeding complete!');
}

seed().catch(console.error);
