-- Drop the existing payments table
DROP TABLE IF EXISTS "payments";

-- Recreate the payments table with serial ID
CREATE TABLE "payments" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
  "amount" REAL NOT NULL,
  "payment_method" TEXT NOT NULL,
  "payment_date" TIMESTAMP NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL,
  "created_by" TEXT NOT NULL
);