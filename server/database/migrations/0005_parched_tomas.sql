CREATE TABLE "business_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"shop_name" text,
	"business_type" text,
	"years_in_business" integer,
	"business_description" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"specializations" jsonb,
	"services" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" real NOT NULL,
	"interval" text NOT NULL,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"max_clients" integer,
	"max_styles" integer,
	"max_storage" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
