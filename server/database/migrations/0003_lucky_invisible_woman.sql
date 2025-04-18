CREATE TABLE "measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"height" real,
	"weight" real,
	"bust" real,
	"waist" real,
	"hip" real,
	"inseam" real,
	"shoulder" real,
	"sleeve" real,
	"neck" real,
	"chest" real,
	"thigh" real,
	"additional_measurements" jsonb,
	"notes" text,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "measurements_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "styles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"details" jsonb,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "styles" ADD CONSTRAINT "styles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;