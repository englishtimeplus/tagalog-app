import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
 
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string;
      email: string;
      password: string;
      image?: string;
    };
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    //@typescript-eslint/no-unsafe-member-access
    const image = body.image ?? "";

    // Create user
    const newUser = await db.insert(users).values({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      image: image,
    }).returning();

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: newUser[0]?.id,
        name: newUser[0]?.name,
        email: newUser[0]?.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 