"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FlashcardPage() { 
 
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wordsPerLesson] = useState(20);
  const { data: lessonsData, isLoading, error } = api.words.getLessons.useQuery({
    wordsPerLesson,
  });

    
  const handleLessonClick = (lessonNumber: number) => {
    router.push(`/flashcard/card?lesson=${lessonNumber}`);
  };

  const handleMyPage = () => {
    router.push("/mypage");
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Flashcard Lessons</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Flashcard Lessons</h1>
        <div className="text-red-500">Error loading lessons: {error.message}</div>
      </div>
    );
  }

  return (
      <div className="container mx-auto p-6">
          <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold mb-6">Flashcard Lessons</h1>
              {session && (
                 <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Avatar className="w-8 h-8 cursor-pointer">
                            <AvatarImage src={session.user?.image ?? ""} />
                            <AvatarFallback>
                                {session.user?.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleMyPage}>
                          My Page
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <p className="text-sm font-medium">{session.user?.name}</p>
                 </div>  
              )}
          </div>
       
      <p className="text-gray-600 mb-8">
        총 {lessonsData?.totalWords}개의 단어가 {lessonsData?.lessons.length}개의 레슨으로 나뉘어 있습니다.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lessonsData?.lessons.map((lesson) => (
          <Card 
            key={lesson.lessonNumber} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleLessonClick(lesson.lessonNumber)}
          >
            <CardHeader>
              <CardTitle className="text-xl">
                Lesson {lesson.lessonNumber}
              </CardTitle>
            </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2">
              <p className="text-gray-600 mb-2">
                단어 {lesson.startWord} ~ {lesson.endWord}
              </p>
              <p className="text-sm text-gray-500">
                {lesson.wordCount}개 단어
                    </p>
                    </div>
                    <div className="flex items-center gap-2">
              <Button 
                className=" mt-4"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/flashcard/card?lesson=${lesson.lessonNumber}`);
                }}
              >
                플래시카드 1
                    </Button>
                    <Button 
                className=" mt-4"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/flashcard/tinder?lesson=${lesson.lessonNumber}`);
                }}
              >
                플래시카드 2
                    </Button>
                    </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


 