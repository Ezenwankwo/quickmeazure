CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"amount" real NOT NULL,
	"payment_method" text NOT NULL,
	"payment_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;