import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, sql, asc, and } from "drizzle-orm";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { users, userProgress, userWordProgress } from "@/server/db/schema";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, input.email),
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Create user
      const newUser = await ctx.db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
      }).returning();

      return {
        id: newUser[0]?.id,
        name: newUser[0]?.name,
        email: newUser[0]?.email,
      };
    }),

  getProgress: protectedProcedure
    .query(async ({ ctx }) => {
      const progress = await ctx.db.query.userProgress.findFirst({
        where: (userProgress, { eq }) => eq(userProgress.userId, ctx.session.user.id),
      });

      return progress ?? {
        userId: ctx.session.user.id,
        currentPage: 1,
        totalPages: 1,
        wordsCompleted: 0,
        totalWords: 0,
        lastAccessed: new Date(),
      };
    }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        currentPage: z.number().min(1),
        totalPages: z.number().min(1),
        wordsCompleted: z.number().min(0),
        totalWords: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingProgress = await ctx.db.query.userProgress.findFirst({
        where: (userProgress, { eq }) => eq(userProgress.userId, ctx.session.user.id),
      });

      if (existingProgress) {
        // Update existing progress
        const updatedProgress = await ctx.db
          .update(userProgress)
          .set({
            currentPage: input.currentPage,
            totalPages: input.totalPages,
            wordsCompleted: input.wordsCompleted,
            totalWords: input.totalWords,
            lastAccessed: new Date(),
          })
          .where(eq(userProgress.userId, ctx.session.user.id))
          .returning();

        return updatedProgress[0];
      } else {
        // Create new progress
        const newProgress = await ctx.db.insert(userProgress).values({
          userId: ctx.session.user.id,
          currentPage: input.currentPage,
          totalPages: input.totalPages,
          wordsCompleted: input.wordsCompleted,
          totalWords: input.totalWords,
        }).returning();

        return newProgress[0];
      }
    }),

  getDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { db } = ctx;
      const userId = ctx.session.user.id;

      // Get overall progress
      const progress = await db.query.userProgress.findFirst({
        where: (userProgress, { eq }) => eq(userProgress.userId, userId),
      });

      // Get word progress statistics
      const wordStats = await db
        .select({
          totalAnswered: sql<number>`count(*)`,
          knownWords: sql<number>`sum(case when known = 1 then 1 else 0 end)`,
          unknownWords: sql<number>`sum(case when known = 0 then 1 else 0 end)`,
        })
        .from(userWordProgress)
        .where(eq(userWordProgress.userId, userId));

      // Get lesson completion stats
      const lessonStats = await db
        .select({
          lessonNumber: userWordProgress.lessonNumber,
          totalWords: sql<number>`count(*)`,
          knownWords: sql<number>`sum(case when known = 1 then 1 else 0 end)`,
        })
        .from(userWordProgress)
        .where(eq(userWordProgress.userId, userId))
        .groupBy(userWordProgress.lessonNumber)
        .orderBy(asc(userWordProgress.lessonNumber));

      // Get recent activity (last 7 days)
      const recentActivity = await db
        .select({
          date: sql<string>`date(created_at)`,
          wordsLearned: sql<number>`count(*)`,
        })
        .from(userWordProgress)
        .where(
          and(
            eq(userWordProgress.userId, userId),
            sql`created_at >= date('now', '-7 days')`
          )
        )
        .groupBy(sql`date(created_at)`)
        .orderBy(sql`date(created_at) desc`);

      const stats = wordStats[0] ?? { totalAnswered: 0, knownWords: 0, unknownWords: 0 };
      
      return {
        progress: progress ?? {
          currentPage: 1,
          totalPages: 1,
          wordsCompleted: 0,
          totalWords: 0,
          lastAccessed: new Date(),
        },
        wordStats: stats,
        lessonStats,
        recentActivity,
        accuracy: stats.totalAnswered > 0 ? Math.round((stats.knownWords / stats.totalAnswered) * 100) : 0,
      };
    }),
}); 