"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { signOut } from "next-auth/react";

export default function TinderPage() {
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState<"id" | "no" | "tagalog" | "english" | "createdAt">("id");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
  const [audioLoading, setAudioLoading] = useState<Record<string, boolean>>({});
  const progressUpdatedRef = useRef<number | null>(null);

  const { data, isLoading, error } = api.words.getWords.useQuery({
    page: currentPage,
    limit: 20,
    search: searchTerm,
    orderBy,
    orderDirection,
  });

  const { data: userProgress, refetch: refetchProgress } = api.user.getProgress.useQuery(
    undefined,
    { enabled: !!session?.user }
  );

  const updateProgressMutation = api.user.updateProgress.useMutation({
    onSuccess: () => {
      void refetchProgress();
    },
  });

  const [currentSession, setCurrentSession] = useState(1);
  const totalSessions = data?.pagination.totalPages ?? 1;

  // Load saved progress on component mount
  useEffect(() => {
    if (userProgress && session?.user) {
      setCurrentPage(userProgress.currentPage);
      setCurrentSession(userProgress.currentPage);
    }
  }, [userProgress, session?.user]);

  useEffect(() => {
    if (session?.user && data?.pagination && progressUpdatedRef.current !== currentPage) {
      progressUpdatedRef.current = currentPage;
      updateProgressMutation.mutate({
        currentPage,
        totalPages: data.pagination.totalPages,
        wordsCompleted: (currentPage - 1) * 20,
        totalWords: data.pagination.total,
      });
    }
  }, [currentPage, data?.pagination, session?.user, updateProgressMutation]);

  const playAudio = async (wordNo: number, type: "word" | "sentence") => {
    const key = `${wordNo}-${type}`;
    setAudioLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const audioPath = `${process.env.NEXT_PUBLIC_AUDIO_URL}/row_${String(wordNo).padStart(4, '0')}_${type}.mp3?raw=true`;
      const audio = new Audio(audioPath);
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      setAudioLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleNextSession = () => {
    if (currentPage < totalSessions) {
      setCurrentPage(currentPage + 1);
      setCurrentSession(currentSession + 1);
    }
  };

  const handlePrevSession = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setCurrentSession(currentSession - 1);
    }
  };

  const progressPercentage = (currentSession / totalSessions) * 100;
  const userProgressPercentage = userProgress ? (userProgress.wordsCompleted / userProgress.totalWords) * 100 : 0;

  if (status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading Tagalog words...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-red-500">Error loading words: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* User Header */}
      {session?.user && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {session.user.image && (
                  <Image
                    src={`/${session.user.image}`}
                    alt="Profile"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    Welcome, {session.user.name ?? session.user.email}!
                  </h2>
                  {userProgress && (
                    <div className="text-sm text-muted-foreground">
                      Overall Progress: {Math.round(userProgressPercentage)}% • 
                      Words Completed: {userProgress.wordsCompleted} / {userProgress.totalWords}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="text-red-600 hover:text-red-700"
              >
                Sign Out
              </Button>
            </div>
            {userProgress && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Overall Learning Progress</span>
                  <span>{Math.round(userProgressPercentage)}%</span>
                </div>
                <Progress value={userProgressPercentage} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Tagalog Vocabulary Learning
          </CardTitle>
          <div className="text-center text-muted-foreground">
            Session {currentSession} of {totalSessions} • {data?.pagination.total ?? 0} total words
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4"> 
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Session Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="flex justify-between items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handlePrevSession}
                  disabled={currentPage <= 1}
                  variant="outline"
                >
                  ← Previous Session
                </Button>
              </motion.div>
              <span className="text-sm text-muted-foreground">
                Words {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, data?.pagination.total ?? 0)}
              </span>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleNextSession}
                  disabled={currentPage >= totalSessions}
                  variant="outline"
                >
                  Next Session →
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vocabulary List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Tagalog / English</TableHead>
                <TableHead>Example / Translation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.words.map((word) => (
                <TableRow key={word.id}>
                  <TableCell className="font-medium">{word.no}</TableCell>
                  <TableCell>
                    <div className="space-y-2 ">
                      <Button
                        variant="outline"
                        onClick={() => playAudio(word.no, "word")}
                        disabled={audioLoading[`${word.no}-word`]}
                        className="flex items-center"
                      >
                        {audioLoading[`${word.no}-word`] ? (
                          <svg className="animate-spin mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : null}
                        {word.tagalog}
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        {word.english}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => playAudio(word.no, "sentence")}
                        disabled={audioLoading[`${word.no}-sentence`]}
                        className="flex items-center"
                      >
                        {audioLoading[`${word.no}-sentence`] ? (
                          <svg className="animate-spin mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : null}
                        {word.example}
                      </Button>
                      <div className="text-green-600 text-sm">
                        {word.translation}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {data?.words.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No words found. Try adjusting your search or filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 