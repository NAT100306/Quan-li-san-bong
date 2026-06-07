const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Atmatna88%40%40@db.zayecaidaasmjakumygq.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase!');

    const sqls = [
      `DO $$ BEGIN CREATE TYPE role_type AS ENUM ('ADMIN','STAFF','CUSTOMER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE pitch_type AS ENUM ('MINI_5','MINI_7','STANDARD_11'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE pitch_status AS ENUM ('ACTIVE','MAINTENANCE','INACTIVE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('PENDING','CONFIRMED','CANCELLED','COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('CASH','BANK_TRANSFER','MOMO','VNPAY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('PENDING','COMPLETED','FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role role_type NOT NULL DEFAULT 'CUSTOMER',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS pitches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type pitch_type NOT NULL,
        price_per_hour DECIMAL(10,2) NOT NULL,
        status pitch_status NOT NULL DEFAULT 'ACTIVE',
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        status booking_status NOT NULL DEFAULT 'PENDING',
        total_price DECIMAL(10,2) NOT NULL,
        check_in_code UUID UNIQUE DEFAULT gen_random_uuid(),
        check_in_status BOOLEAN DEFAULT FALSE,
        check_in_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        payment_method payment_method NOT NULL DEFAULT 'CASH',
        status payment_status NOT NULL DEFAULT 'PENDING',
        transaction_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE pitches ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE bookings ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE payments ENABLE ROW LEVEL SECURITY`,
    ];

    for (const sql of sqls) {
      try {
        await client.query(sql);
        console.log('✅ OK:', sql.trim().slice(0, 60));
      } catch (e) {
        console.log('⚠️  ERR:', e.message.slice(0, 80), '|', sql.trim().slice(0, 40));
      }
    }

    // Insert admin profile
    await client.query(`
      INSERT INTO profiles (id, email, name, role)
      VALUES ('0a83f74f-0bef-4caa-8720-0b06a21f881a', 'admin@sanfootball.com', 'Admin', 'ADMIN')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Admin profile inserted!');

    await client.end();
    console.log('🎉 DONE — All tables created!');
  } catch (e) {
    console.error('❌ Fatal:', e.message);
    process.exit(1);
  }
}

run();
