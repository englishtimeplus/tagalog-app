import { z } from "zod";
import { desc, eq, sql, asc, and } from "drizzle-orm";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { wordsTable, userWordProgress } from "@/server/db/schema";

export const wordsRouter = createTRPCRouter({
  getWords: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        orderBy: z.enum(["id", "no", "tagalog", "english", "createdAt"]).default("id"),
        orderDirection: z.enum(["asc", "desc"]).default("asc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, orderBy, orderDirection } = input;
      const offset = (page - 1) * limit;

      let whereClause = undefined;
      if (search?.trim()) {
        whereClause = sql`(${wordsTable.tagalog} LIKE ${`%${search}%`} OR ${wordsTable.english} LIKE ${`%${search}%`} OR ${wordsTable.translation} LIKE ${`%${search}%`})`;
      }

      const getOrderByColumn = () => {
        switch (orderBy) {
          case "id":
            return wordsTable.id;
          case "no":
            return wordsTable.no;
          case "tagalog":
            return wordsTable.tagalog;
          case "english":
            return wordsTable.english;
          case "createdAt":
            return wordsTable.createdAt;
          default:
            return wordsTable.id;
        }
      };

      const orderByColumn = getOrderByColumn();
      const orderFunction = orderDirection === "asc" ? asc : desc;

      const [words, totalCount] = await Promise.all([
        ctx.db
          .select()
          .from(wordsTable)
          .where(whereClause)
          .orderBy(orderFunction(orderByColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(wordsTable)
          .where(whereClause)
          .then((result) => result[0]?.count ?? 0),
      ]);

      return {
        words,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    }),

  getWordById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const word = await ctx.db
        .select()
        .from(wordsTable)
        .where(eq(wordsTable.id, input.id))
        .limit(1);

      return word[0] ?? null;
    }),

  getLessons: publicProcedure
    .input(z.object({ wordsPerLesson: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const { wordsPerLesson } = input;
      
      const totalWords = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(wordsTable)
        .then((result) => result[0]?.count ?? 0);

      const totalLessons = Math.ceil(totalWords / wordsPerLesson);
      const lessons = [];

      for (let i = 1; i <= totalLessons; i++) {
        const startWord = (i - 1) * wordsPerLesson + 1;
        const endWord = Math.min(i * wordsPerLesson, totalWords);
        
        lessons.push({
          lessonNumber: i,
          startWord,
          endWord,
          wordCount: endWord - startWord + 1,
        });
      }

      return { lessons, totalWords };
    }),

  getWordsByLesson: publicProcedure
    .input(z.object({ 
      lessonNumber: z.number(),
      wordsPerLesson: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      const { lessonNumber, wordsPerLesson } = input;
      const startId = (lessonNumber - 1) * wordsPerLesson + 1;
      const endId = lessonNumber * wordsPerLesson;

      const words = await ctx.db
        .select()
        .from(wordsTable)
        .where(sql`${wordsTable.id} >= ${startId} AND ${wordsTable.id} <= ${endId}`)
        .orderBy(asc(wordsTable.id));

      return words;
    }),

  saveWordProgress: protectedProcedure
    .input(z.object({
      wordId: z.number(),
      known: z.boolean(),
      lessonNumber: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { wordId, known, lessonNumber } = input;
      
      // Check if progress already exists for this user and word
      const existingProgress = await ctx.db
        .select()
        .from(userWordProgress)
        .where(
          and(
            eq(userWordProgress.userId, ctx.session.user.id),
            eq(userWordProgress.wordId, wordId)
          )
        )
        .limit(1);

      if (existingProgress.length > 0) {
        // Update existing progress
        await ctx.db
          .update(userWordProgress)
          .set({ 
            known,
            lessonNumber,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userWordProgress.userId, ctx.session.user.id),
              eq(userWordProgress.wordId, wordId)
            )
          );
      } else {
        // Insert new progress
        await ctx.db
          .insert(userWordProgress)
          .values({
            userId: ctx.session.user.id,
            wordId,
            known,
            lessonNumber,
          });
      }

      return { success: true };
    }),

  getLessonStats: protectedProcedure
    .input(z.object({
      lessonNumber: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { lessonNumber } = input;
      
      const progressData = await ctx.db
        .select({
          known: userWordProgress.known,
        })
        .from(userWordProgress)
        .where(
          and(
            eq(userWordProgress.userId, ctx.session.user.id),
            eq(userWordProgress.lessonNumber, lessonNumber)
          )
        );

      const total = progressData.length;
      const known = progressData.filter(p => p.known).length;
      const unknown = total - known;

      return {
        total,
        known,
        unknown,
      };
    }),
}); 