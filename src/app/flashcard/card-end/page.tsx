"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { CheckIcon, XIcon, BookIcon } from "lucide-react";
import { Suspense } from "react";

function FlashcardCardEndP() {
  const searchParams = useSearchParams(); 
  const params = { lesson: searchParams.get("lesson") ?? "1" };
  const router = useRouter(); 
  const { data: session } = useSession();
  const lesson = params.lesson;
  const lessonNumber = lesson ? parseInt(lesson) : 1;

  const { data: stats, isLoading } = api.words.getLessonStats.useQuery(
    { lessonNumber },
    { enabled: !!session?.user }
  );

  const handleBackToLessons = () => {
    router.push("/flashcard");
  };

  const handleTryAgain = () => {
    router.push(`/flashcard/tinder?lesson=${lessonNumber}`);
  };

  const handleNextLesson = () => {
    router.push(`/flashcard/tinder?lesson=${lessonNumber + 1}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-lg">Loading results...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const total = stats?.total ?? 0;
  const known = stats?.known ?? 0;
  const unknown = stats?.unknown ?? 0;
  const accuracy = total > 0 ? Math.round((known / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Lesson {lessonNumber} Complete! 🎉
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Great job! Here are your results:
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <BookIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-800">{total}</p>
                  <p className="text-sm text-blue-600">Total Words</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-800">{known}</p>
                  <p className="text-sm text-green-600">Known</p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <XIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-800">{unknown}</p>
                  <p className="text-sm text-red-600">Unknown</p>
                </CardContent>
              </Card>
            </div>

            {/* Accuracy */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                <div>
                  <p className="text-3xl font-bold">{accuracy}%</p>
                  <p className="text-sm">Accuracy</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{known}/{total} words known</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={handleTryAgain}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleNextLesson}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Next Lesson
                </Button>
              </div>
              
              <Button 
                onClick={handleBackToLessons}
                variant="ghost"
                className="w-full"
              >
                Back to All Lessons
              </Button>
            </div>

            {/* Motivational Message */}
            <div className="text-center pt-4 border-t">
              {accuracy >= 80 ? (
                <p className="text-green-600 font-medium">
                  Excellent work! You&apos;re mastering these words! 🌟
                </p>
              ) : accuracy >= 60 ? (
                <p className="text-yellow-600 font-medium">
                  Good progress! Keep practicing these words. 📚
                </p>
              ) : (
                <p className="text-red-600 font-medium">
                  Don&apos;t give up! Review these words and try again. 💪
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function FlashcardCardEndPage() {
 
  return <Suspense fallback={<div>Loading...</div>}><FlashcardCardEndP /></Suspense>;

 
}
