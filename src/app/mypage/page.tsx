"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Get user progress data
  const { data: userProgress, isLoading: progressLoading } = api.user.getProgress.useQuery(
    undefined,
    { enabled: !!session }
  );
  
  // Get lessons data for overview
  const { data: lessonsData } = api.words.getLessons.useQuery({
    wordsPerLesson: 20,
  });

  if (status === "loading" || progressLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Calculate overall progress
  const overallProgress = userProgress && userProgress.totalWords > 0 ? 
    Math.round((userProgress.wordsCompleted / userProgress.totalWords) * 100) : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={session.user?.image ?? ""} />
            <AvatarFallback className="text-lg">
              {session.user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">학습 대시보드</h1>
            <p className="text-gray-600">안녕하세요, {session.user.name ?? session.user.email}님!</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">메뉴</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/flashcard")}>
              플래시카드 
                      </DropdownMenuItem>
                      
            <DropdownMenuItem onClick={() => router.push("/feed")}>
              단어 목록
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/words")}>
              단어장
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/")}>
                          Home
                      </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
            로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 진행률</CardTitle>
            <div className="h-4 w-4 text-blue-600">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <div className="text-xs text-muted-foreground">
              {userProgress?.wordsCompleted ?? 0} / {userProgress?.totalWords ?? 0} 단어
            </div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 단어 수</CardTitle>
            <div className="h-4 w-4 text-green-600">📚</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lessonsData?.totalWords ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              학습 가능한 단어
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 레슨</CardTitle>
            <div className="h-4 w-4 text-purple-600">🎯</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress?.currentPage ?? 1}</div>
            <div className="text-xs text-muted-foreground">
              총 {userProgress?.totalPages ?? 1}개 레슨
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 레슨 수</CardTitle>
            <div className="h-4 w-4 text-orange-600">📖</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lessonsData?.lessons.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              사용 가능한 레슨
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Learning Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>학습 진행 상황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">전체 진행률</span>
                <span className="text-sm">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>학습한 단어:</span>
                  <span className="font-medium">{userProgress?.wordsCompleted ?? 0}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>남은 단어:</span>
                  <span className="font-medium">
                    {(userProgress?.totalWords ?? 0) - (userProgress?.wordsCompleted ?? 0)}개
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>현재 레슨:</span>
                  <span className="font-medium">{userProgress?.currentPage ?? 1}번</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Lessons Overview */}
        <Card>
          <CardHeader>
            <CardTitle>레슨 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {lessonsData?.lessons ? (
                lessonsData.lessons.slice(0, 8).map((lesson) => {
                  const isCurrentLesson = lesson.lessonNumber === (userProgress?.currentPage ?? 1);
                  const isCompleted = lesson.lessonNumber < (userProgress?.currentPage ?? 1);
                  
                  return (
                    <div 
                      key={lesson.lessonNumber} 
                      className={`flex justify-between items-center p-3 rounded-lg border ${
                        isCurrentLesson ? 'border-blue-500 bg-blue-50' : 
                        isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm">Lesson {lesson.lessonNumber}</div>
                        <div className="text-xs text-gray-600">
                          단어 {lesson.startWord}-{lesson.endWord}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${
                          isCurrentLesson ? 'text-blue-600' :
                          isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {isCurrentLesson ? '진행중' : isCompleted ? '완료' : '대기중'}
                        </div>
                        <div className="text-xs text-gray-500">{lesson.wordCount}개 단어</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>레슨 데이터를 로드하는 중...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 액션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => router.push("/flashcard")}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <div className="text-2xl">🔄</div>
              <span>플래시카드 계속하기</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/feed")}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <div className="text-2xl">📋</div>
              <span>단어 목록 보기</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push(`/flashcard/card?lesson=${userProgress?.currentPage ?? 1}`)}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <div className="text-2xl">📚</div>
              <span>현재 레슨 시작</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>이름:</strong> {session.user.name ?? "등록되지 않음"}</p>
            <p><strong>이메일:</strong> {session.user.email}</p>
            <p><strong>마지막 접속:</strong> {userProgress?.lastAccessed ? 
              new Date(userProgress.lastAccessed).toLocaleDateString('ko-KR') : 
              "정보 없음"
            }</p>
            <p><strong>가입일:</strong> {session.user.image ? "Google 계정" : "이메일 계정"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
