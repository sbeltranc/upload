CREATE TABLE "upload" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "upload_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key" varchar(255) NOT NULL,
	"hash" varchar(255) NOT NULL,
	"ext" varchar(255) NOT NULL,
	"mime" varchar(255) NOT NULL,
	"uploadedDate" date DEFAULT now() NOT NULL
);
