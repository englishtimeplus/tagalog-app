import { relations, sql } from "drizzle-orm";
import { index, primaryKey, sqliteTableCreator } from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters"; 

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator(
  (name) => `tagalog-app-2_${name}`,
);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }),
    createdById: d
      .text({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.text({ length: 255 }),
  email: d.text({ length: 255 }).notNull(),
  emailVerified: d.integer({ mode: "timestamp" }).default(sql`(unixepoch())`),
  image: d.text({ length: 255 }),
  password: d.text({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  progress: many(userProgress),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.text({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.text({ length: 255 }).notNull(),
    providerAccountId: d.text({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.text({ length: 255 }),
    scope: d.text({ length: 255 }),
    id_token: d.text(),
    session_state: d.text({ length: 255 }),
  }),
  (t) => [
    primaryKey({
      columns: [t.provider, t.providerAccountId],
    }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.text({ length: 255 }).notNull().primaryKey(),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.integer({ mode: "timestamp" }).notNull(),
  }),
  (t) => [index("session_userId_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.text({ length: 255 }).notNull(),
    token: d.text({ length: 255 }).notNull(),
    expires: d.integer({ mode: "timestamp" }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const wordsTable = createTable("words_table", (d) => ({
  id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  no: d.integer({ mode: "number" }).notNull(),
  tagalog: d.text({ length: 255 }).notNull(),
  english: d.text({ length: 255 }).notNull(),
  example: d.text({ length: 255 }).notNull(),
  translation: d.text({ length: 255 }).notNull(),
  chunk: d.text({ length: 255 }).notNull(),
  audio1: d.text({ length: 255 }),
  audio2: d.text({ length: 255 }),
  createdAt: d.integer({ mode: "timestamp" }).notNull(),
}),
  (t) => [index("no_idx").on(t.no)],
);

export const userProgress = createTable("user_progress", (d) => ({
  id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: d
    .text({ length: 255 })
    .notNull()
    .references(() => users.id),
  currentPage: d.integer({ mode: "number" }).notNull().default(1),
  totalPages: d.integer({ mode: "number" }).notNull().default(1),
  wordsCompleted: d.integer({ mode: "number" }).notNull().default(0),
  totalWords: d.integer({ mode: "number" }).notNull().default(0),
  lastAccessed: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}),
  (t) => [
    index("user_progress_user_id_idx").on(t.userId),
    index("user_progress_last_accessed_idx").on(t.lastAccessed),
  ],
);

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
}));

export const userWordProgress = createTable("user_word_progress", (d) => ({
  id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: d
    .text({ length: 255 })
    .notNull()
    .references(() => users.id),
  wordId: d
    .integer({ mode: "number" })
    .notNull()
    .references(() => wordsTable.id),
  known: d.integer({ mode: "boolean" }).notNull(), // true = known (right swipe), false = unknown (left swipe)
  lessonNumber: d.integer({ mode: "number" }).notNull(),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}),
  (t) => [
    index("user_word_progress_user_id_idx").on(t.userId),
    index("user_word_progress_word_id_idx").on(t.wordId),
    index("user_word_progress_lesson_idx").on(t.lessonNumber),
  ],
);

export const userWordProgressRelations = relations(userWordProgress, ({ one }) => ({
  user: one(users, { fields: [userWordProgress.userId], references: [users.id] }),
  word: one(wordsTable, { fields: [userWordProgress.wordId], references: [wordsTable.id] }),
}));