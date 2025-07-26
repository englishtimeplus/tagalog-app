import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { wordsTable } from "@/server/db/schema";
import { readFileSync } from "fs";
import { join } from "path";

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export async function POST() {
  try {
    // Read the CSV file
    const csvPath = join(process.cwd(), "public", "word2000.csv");
    const csvContent = readFileSync(csvPath, "utf-8");
    
    // Parse CSV content
    const lines = csvContent.split("\n");
    // const headers = lines[0]?.split(",") ?? [];
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    const words = dataLines.map((line, index) => {
      const values = parseCSVLine(line);
      return {
        no: parseInt(values[0] ?? "0") || index + 1,
        tagalog: values[1]?.replace(/^"|"$/g, "") ?? "", // Remove quotes
        english: values[2]?.replace(/^"|"$/g, "") ?? "",
        example: values[3]?.replace(/^"|"$/g, "") ?? "",
        translation: values[4]?.replace(/^"|"$/g, "") ?? "",
        chunk: "", // This field is not in the CSV, so we'll leave it empty
        audio1: null,
        audio2: null,
        createdAt: new Date(), // Use Date object instead of timestamp
      };
    }).filter(word => word.tagalog && word.english); // Filter out empty entries
    
    // Insert into database
     await db.insert(wordsTable).values(words);
    
    return NextResponse.json({
      success: true,
      insertedCount: words.length,
      message: `Successfully inserted ${words.length} words`
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 