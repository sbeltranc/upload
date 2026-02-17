import { integer, date, pgTable, varchar } from "drizzle-orm/pg-core";

export const uploadTable = pgTable("upload", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    
    key: varchar({ length: 255 }).notNull(),
    hash: varchar({ length: 255 }).notNull(),

    ext: varchar({ length: 255 }).notNull(),
    mime: varchar({ length: 255 }).notNull(),
    
    uploadedDate: date().notNull().defaultNow(),
});