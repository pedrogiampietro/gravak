CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account" varchar(32) NOT NULL,
	"hash" varchar(60) NOT NULL,
	"name" varchar(32) NOT NULL,
	"character" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_name_unique" ON "accounts" USING btree ("account","name");