CREATE TYPE "public"."contact_role" AS ENUM('primary_contact', 'decision_maker', 'billing_contact', 'technical_contact', 'stakeholder');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('prospect', 'active', 'paused', 'churned');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" text,
	"action" varchar(50) NOT NULL,
	"changes" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_ai_options" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"chat_type_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"max_tokens" integer,
	"temperature" numeric,
	"top_p" numeric,
	"frequency_penalty" numeric,
	"presence_penalty" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_ai_options_chat_type_id_unique" UNIQUE("chat_type_id"),
	CONSTRAINT "max_tokens_check" CHECK ("chat_ai_options"."max_tokens" IS NULL OR ("chat_ai_options"."max_tokens" > 0 AND "chat_ai_options"."max_tokens" <= 100000)),
	CONSTRAINT "temperature_range" CHECK ("chat_ai_options"."temperature" IS NULL OR ("chat_ai_options"."temperature" >= 0 AND "chat_ai_options"."temperature" <= 2)),
	CONSTRAINT "top_p_range" CHECK ("chat_ai_options"."top_p" IS NULL OR ("chat_ai_options"."top_p" >= 0 AND "chat_ai_options"."top_p" <= 1)),
	CONSTRAINT "frequency_penalty_range" CHECK ("chat_ai_options"."frequency_penalty" IS NULL OR ("chat_ai_options"."frequency_penalty" >= -2 AND "chat_ai_options"."frequency_penalty" <= 2)),
	CONSTRAINT "presence_penalty_range" CHECK ("chat_ai_options"."presence_penalty" IS NULL OR ("chat_ai_options"."presence_penalty" >= -2 AND "chat_ai_options"."presence_penalty" <= 2))
);
--> statement-breakpoint
CREATE TABLE "chat_types" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"seo_friendly_id" "citext" NOT NULL,
	"seo_friendly_base64_id" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_types_name_unique" UNIQUE("name"),
	CONSTRAINT "chat_types_seo_friendly_id_unique" UNIQUE("seo_friendly_id"),
	CONSTRAINT "chat_types_seo_friendly_base64_id_unique" UNIQUE("seo_friendly_base64_id"),
	CONSTRAINT "chat_types_name_length_check" CHECK (length("chat_types"."name") >= 1 AND length("chat_types"."name") <= 200),
	CONSTRAINT "chat_types_seo_friendly_id_length_check" CHECK (length("chat_types"."seo_friendly_id") >= 1 AND length("chat_types"."seo_friendly_id") <= 200 AND "chat_types"."seo_friendly_id" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "chat_types_seo_friendly_base64_id_length_check" CHECK (length("chat_types"."seo_friendly_base64_id") = 22),
	CONSTRAINT "chat_types_description_length_check" CHECK (length("chat_types"."description") >= 1 AND length("chat_types"."description") <= 500)
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"chat_type_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_people" (
	"customer_person_id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"customer_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" "contact_role" NOT NULL,
	"is_primary" boolean DEFAULT false,
	"start_date" date DEFAULT now() NOT NULL,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_people_end_date_check" CHECK ("customer_people"."end_date" IS NULL OR "customer_people"."end_date" >= "customer_people"."start_date")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"customer_id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"status" "customer_status" DEFAULT 'prospect' NOT NULL,
	"industry" text,
	"company_size" integer,
	"website_url" text,
	"billing_country" char(2),
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_legal_name_length_check" CHECK (length(trim("customers"."legal_name")) BETWEEN 2 AND 200),
	CONSTRAINT "customers_display_name_length_check" CHECK (length(trim("customers"."display_name")) BETWEEN 2 AND 200),
	CONSTRAINT "customers_industry_length_check" CHECK ("customers"."industry" IS NULL OR length("customers"."industry") <= 100),
	CONSTRAINT "customers_company_size_check" CHECK ("customers"."company_size" IS NULL OR "customers"."company_size" > 0),
	CONSTRAINT "customers_website_url_format_check" CHECK ("customers"."website_url" IS NULL OR "customers"."website_url" ~* '^https?://'),
	CONSTRAINT "customers_billing_country_format_check" CHECK ("customers"."billing_country" IS NULL OR "customers"."billing_country" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "data_retrieval_message_parts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"message_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"text_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "text_json_required_if_type_is_text" CHECK (
        CASE
          WHEN "data_retrieval_message_parts"."type" = 'text'
          THEN "data_retrieval_message_parts"."text_json" IS NOT NULL
          ELSE TRUE
        END
      )
);
--> statement-breakpoint
CREATE TABLE "data_retrieval_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"chat_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" varchar NOT NULL,
	CONSTRAINT "role_length_check" CHECK (char_length("messages"."role") <= 15)
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"message_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"text_text" text,
	"reasoning_text" text,
	"file_media_type" varchar,
	"file_filename" varchar,
	"file_url" varchar,
	"source_url_source_id" varchar,
	"source_url_url" varchar,
	"source_url_title" varchar,
	"source_document_source_id" varchar,
	"source_document_media_type" varchar,
	"source_document_title" varchar,
	"source_document_filename" varchar,
	"tool_tool_call_id" varchar,
	"tool_state" varchar,
	"tool_error_text" varchar,
	"tool_heart_of_darkness_qa_input" jsonb,
	"tool_heart_of_darkness_qa_output" jsonb,
	"tool_heart_of_darkness_qa_error_text" varchar,
	"data_content" jsonb,
	"provider_metadata" jsonb,
	CONSTRAINT "text_text_required_if_type_is_text" CHECK (CASE WHEN "parts"."type" = 'text' THEN "parts"."text_text" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "reasoning_text_required_if_type_is_reasoning" CHECK (CASE WHEN "parts"."type" = 'reasoning' THEN "parts"."reasoning_text" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "file_fields_required_if_type_is_file" CHECK (CASE WHEN "parts"."type" = 'file' THEN "parts"."file_media_type" IS NOT NULL AND "parts"."file_url" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "source_url_fields_required_if_type_is_source_url" CHECK (CASE WHEN "parts"."type" = 'source_url' THEN "parts"."source_url_source_id" IS NOT NULL AND "parts"."source_url_url" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "source_document_fields_required_if_type_is_source_document" CHECK (CASE WHEN "parts"."type" = 'source_document' THEN "parts"."source_document_source_id" IS NOT NULL AND "parts"."source_document_media_type" IS NOT NULL AND "parts"."source_document_title" IS NOT NULL ELSE TRUE END),
	CONSTRAINT "data_content_required_if_type_is_data" CHECK (CASE WHEN "parts"."type" = 'data' THEN "parts"."data_content" IS NOT NULL ELSE TRUE END)
);
--> statement-breakpoint
CREATE TABLE "people" (
	"person_id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"job_title" text,
	"linkedin_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_unique_email" UNIQUE("email"),
	CONSTRAINT "people_first_name_length_check" CHECK (length(trim("people"."first_name")) BETWEEN 1 AND 100),
	CONSTRAINT "people_last_name_length_check" CHECK (length(trim("people"."last_name")) BETWEEN 1 AND 100),
	CONSTRAINT "people_email_format_check" CHECK ("people"."email" IS NULL OR "people"."email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
	CONSTRAINT "people_phone_length_check" CHECK ("people"."phone" IS NULL OR length("people"."phone") <= 30),
	CONSTRAINT "people_job_title_length_check" CHECK ("people"."job_title" IS NULL OR length("people"."job_title") <= 100),
	CONSTRAINT "people_linkedin_url_format_check" CHECK ("people"."linkedin_url" IS NULL OR "people"."linkedin_url" ~* '^https?://(www\.)?linkedin\.com/.*$')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"password" text,
	"email" "citext" NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"provider" text,
	"provider_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "provider_check" CHECK ("users"."provider" IN ('google')),
	CONSTRAINT "password_length_check" CHECK ("users"."password" IS NULL OR length("users"."password") = 60),
	CONSTRAINT "role_check" CHECK ("users"."role" IN ('user', 'admin', 'moderator')),
	CONSTRAINT "name_length_check" CHECK (length("users"."name") >= 2 AND length("users"."name") <= 100)
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_ai_options" ADD CONSTRAINT "chat_ai_options_chat_type_id_chat_types_id_fk" FOREIGN KEY ("chat_type_id") REFERENCES "public"."chat_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_chat_type_id_chat_types_id_fk" FOREIGN KEY ("chat_type_id") REFERENCES "public"."chat_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_people" ADD CONSTRAINT "customer_people_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_people" ADD CONSTRAINT "customer_people_person_id_people_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("person_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retrieval_message_parts" ADD CONSTRAINT "data_retrieval_message_parts_message_id_data_retrieval_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."data_retrieval_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_ai_options_chat_type_id_idx" ON "chat_ai_options" USING btree ("chat_type_id");--> statement-breakpoint
CREATE INDEX "chat_types_name_idx" ON "chat_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "chats_user_id_idx" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chats_user_id_updated_at_idx" ON "chats" USING btree ("user_id","updated_at" DESC);--> statement-breakpoint
CREATE INDEX "chats_chat_type_id_idx" ON "chats" USING btree ("chat_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_people_unique" ON "customer_people" USING btree ("customer_id","person_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "one_primary_contact_per_customer" ON "customer_people" USING btree ("customer_id") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "data_retrieval_message_parts_message_id_idx" ON "data_retrieval_message_parts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "data_retrieval_message_parts_text_json_idx" ON "data_retrieval_message_parts" USING gin ("text_json");--> statement-breakpoint
CREATE INDEX "messages_chat_id_idx" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "messages_chat_id_created_at_idx" ON "messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "parts_message_id_idx" ON "parts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "parts_message_id_order_idx" ON "parts" USING btree ("message_id","order");