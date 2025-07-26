"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function MigrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const handleMigration = async () => {
    setIsLoading(true);
    setProgress(0);
    setMessage("Starting migration...");

    try {
      const response = await fetch("/api/migrate-words", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Migration failed");
      }

      const result = await response.json() as { insertedCount: number };
      setMessage(`Migration completed! ${result?.insertedCount  ?? 0} words inserted.`);
      setProgress(100);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Word Migration</CardTitle>
          <CardDescription>
            Import words from word2000.csv to database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleMigration} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Migrating..." : "Start Migration"}
          </Button>
          
          {isLoading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}
          
          {!isLoading && message && (
            <p className="text-sm">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
