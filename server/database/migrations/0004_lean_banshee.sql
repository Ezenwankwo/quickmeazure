CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"zip_code" text,
	"phone" text,
	"email" text,
	"website" text,
	"tax_id" text,
	"business_type" text,
	"description" text,
	"social_media" jsonb,
	"operating_hours" jsonb,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "businesses_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;