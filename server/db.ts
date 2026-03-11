import { Pool, PoolClient } from "pg";

/**
 * Database Connection Module
 * Handles connection pooling and schema initialization
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client", err);
});

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log("[DB] Initializing database schema...");

    /**
     * MIGRATIONS
     * Repair old schemas created by earlier builds
     */

    await client.query(`
      DO $$
      BEGIN

        -- Convert users.id INTEGER -> VARCHAR if needed
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users'
          AND column_name='id'
          AND data_type='integer'
        ) THEN
          ALTER TABLE users
          ALTER COLUMN id TYPE VARCHAR(32)
          USING id::varchar;
        END IF;

        -- Add verified column if missing
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name='users'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users'
          AND column_name='verified'
        ) THEN
          ALTER TABLE users
          ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;

        -- Fix refresh_tokens foreign key mismatch
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='refresh_tokens'
          AND column_name='user_id'
          AND data_type='integer'
        ) THEN

          ALTER TABLE refresh_tokens
          DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;

          ALTER TABLE refresh_tokens
          ALTER COLUMN user_id TYPE VARCHAR(32)
          USING user_id::varchar;

        END IF;

      END $$;
    `);

    /**
     * USERS
     */
    await client.query(`
      DO $$
      BEGIN
      
        -- Add username column if missing
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name='users'
          AND column_name='username'
        ) THEN
          ALTER TABLE users
          ADD COLUMN username VARCHAR(100);
        END IF;
      
        -- Remove NOT NULL constraint if it exists
        BEGIN
          ALTER TABLE users
          ALTER COLUMN username DROP NOT NULL;
        EXCEPTION
          WHEN others THEN NULL;
        END;
      
      END $$;
      `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(32) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email);
    `);

    console.log("[DB] ✓ Users table ready");

    /**
     * VERIFICATION CODES
     */

    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at BIGINT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_email
      ON verification_codes(email);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_expiry
      ON verification_codes(expires_at);
    `);

    console.log("[DB] ✓ Verification codes table ready");

    /**
     * INVOICES
     */

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(32) NOT NULL,
        message_id VARCHAR(255) UNIQUE NOT NULL,
        subject VARCHAR(255),
        from_email VARCHAR(255),
        date TIMESTAMP,
        content TEXT,
        pdf_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT invoices_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_user
      ON invoices(user_id);
    `);

    console.log("[DB] ✓ Invoices table ready");

    /**
     * TRANSACTIONS
     */

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(32) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        date TIMESTAMP NOT NULL,
        receipt_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT transactions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user
      ON transactions(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date
      ON transactions(date);
    `);

    console.log("[DB] ✓ Transactions table ready");

    /**
     * BUDGETS
     */

    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(32) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category),
        CONSTRAINT budgets_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_budgets_user
      ON budgets(user_id);
    `);

    console.log("[DB] ✓ Budgets table ready");

    /**
     * REMINDERS
     */

    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE NOT NULL,
        is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
        recurrence_pattern VARCHAR(50),
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT reminders_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reminders_user
      ON reminders(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reminders_due
      ON reminders(due_date);
    `);

    console.log("[DB] ✓ Reminders table ready");

    console.log("[DB] ✅ Database initialization complete!");
  } catch (error) {
    console.error("[DB] ❌ Database initialization failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function closePool() {
  await pool.end();
  console.log("[DB] Connection pool closed");
}
