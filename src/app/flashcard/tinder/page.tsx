"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// TinderCard component for individual flashcards
interface TinderCardProps {
  word: {
    id: number;
    tagalog: string;
    english: string;
    example: string;
    translation: string;
  };
  onSwipe: (direction: 'left' | 'right') => void;
  isTopCard: boolean;
  style?: React.CSSProperties;
}

function TinderCard({ word, onSwipe, isTopCard, style }: TinderCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [loadingAudio, setLoadingAudio] = useState<'word' | 'sentence' | null>(null);

  const playAudio = (type: 'word' | 'sentence') => {
    setLoadingAudio(type);
    const paddedId = word.id.toString().padStart(4, '0');
    const audioPath = `${process.env.NEXT_PUBLIC_AUDIO_URL}/row_${paddedId}_${type}.mp3?raw=true`;
    const audio = new Audio(audioPath);
    
    audio.addEventListener('loadstart', () => setLoadingAudio(type));
    audio.addEventListener('canplaythrough', () => setLoadingAudio(null));
    audio.addEventListener('error', () => setLoadingAudio(null));
    
    audio.play().catch((error) => {
      console.error(error);
      setLoadingAudio(null);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isTopCard) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isTopCard) return;
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    setDragOffset({ x: deltaX, y: deltaY });
  }, [isDragging, startPos.x, startPos.y, isTopCard]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !isTopCard) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      onSwipe(dragOffset.x > 0 ? 'right' : 'left');
    }
    
    setDragOffset({ x: 0, y: 0 });
  }, [isDragging, dragOffset.x, onSwipe, isTopCard]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0.6, 1 - Math.abs(dragOffset.x) * 0.003);

  const cardStyle: React.CSSProperties = {
    ...style,
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
    opacity,
    cursor: isTopCard ? 'grab' : 'default',
    userSelect: 'none',
    transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
  };

  return (
    <Card 
      className={`absolute w-80 h-96 bg-white shadow-lg ${isTopCard ? 'z-10' : 'z-0'}`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
    >
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="text-center">
          <h2 
            className="text-3xl font-bold text-blue-600 mb-2 cursor-pointer hover:text-blue-800 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              playAudio('word');
            }}
          >
            {word.tagalog}
          </h2>
          {loadingAudio === 'word' && (
            <div className="flex justify-center mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          )} 
          {showAnswer && (
            <div className="space-y-4 mb-2">
                  <p className="text-lg text-gray-600 mb-6">{word.english}</p>
              <div className="p-0 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Example:</p>
                <p className="text-gray-700 cursor-pointer hover:text-gray-900 transition-colors" onClick={(e) => {
                    e.stopPropagation();
                    playAudio('sentence');
                  }}>{word.example}</p>
                {loadingAudio === 'sentence' && (
                  <div className="flex justify-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Translation:</p>
                <p 
                  className="text-blue-800 font-medium cursor-pointer hover:text-blue-900 transition-colors"
                  
                >
                  {word.translation}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              setShowAnswer(!showAnswer);
            }}
            variant="outline"
            className="w-full"
            disabled={!isTopCard}
          >
            {showAnswer ? 'Hide' : 'Show'} Answer
          </Button>
          
          {isTopCard && (
            <div className="flex gap-2">
              <Button 
                onClick={() => onSwipe('left')}
                variant="destructive"
                className="flex-1"
              >
                Unknown ←
              </Button>
              <Button 
                onClick={() => onSwipe('right')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Known →
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Swipe indicators */}
      {isTopCard && Math.abs(dragOffset.x) > 50 && (
        <div className={`absolute top-4 ${dragOffset.x > 0 ? 'right-4' : 'left-4'} 
          px-3 py-1 rounded text-white font-bold text-sm
          ${dragOffset.x > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
          {dragOffset.x > 0 ? 'KNOWN' : 'UNKNOWN'}
        </div>
      )}
    </Card>
  );
}
function Tinder() { 
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = { lesson: searchParams.get("lesson") ?? "1" };
  const lessonNumber = parseInt(params.lesson);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);

  const { data: words, isLoading } = api.words.getWordsByLesson.useQuery({
    lessonNumber,
    wordsPerLesson: 20,
  });

  const { data: lessonStats, refetch: refetchStats } = api.words.getLessonStats.useQuery({
    lessonNumber,
  }, {
    enabled: !!session,
  });

  const saveProgressMutation = api.words.saveWordProgress.useMutation({
    onSuccess: () => {
      void refetchStats();
    },
  });

  useEffect(() => {
    if (lessonStats) {
      setStudiedCount(lessonStats.total);
      setKnownCount(lessonStats.known);
      setUnknownCount(lessonStats.unknown);
    }
  }, [lessonStats]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentWord = words?.[currentCardIndex];
    if (!currentWord || !session) return;
    const known = direction === 'right';

    try {
      await saveProgressMutation.mutateAsync({
        wordId: currentWord.id,
        known,
        lessonNumber,
      });

      // Update local counts
      setStudiedCount(prev => prev + 1);
      if (known) {
        setKnownCount(prev => prev + 1);
      } else {
        setUnknownCount(prev => prev + 1);
      }

      // Move to next card
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to use flashcards</h1>
        <Button onClick={() => router.push('/login')}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Loading flashcards...</h1>
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">No words found for this lesson</h1>
        <Button onClick={() => router.push('/flashcard')}>Back to Lessons</Button>
      </div>
    );
  }

  if (currentCardIndex >= words.length) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">🎉 Lesson Complete!</h1>
        <div className="bg-gray-50 p-6 rounded-lg mb-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Final Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{knownCount}</div>
              <div className="text-sm text-gray-600">Known</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{unknownCount}</div>
              <div className="text-sm text-gray-600">Unknown</div>
            </div>
          </div>
        </div>
        <div className="space-x-4">
          <Button onClick={() => router.push('/flashcard')}>Back to Lessons</Button>
          <Button 
            onClick={() => {
              setCurrentCardIndex(0);
              setStudiedCount(0);
              setKnownCount(0);
              setUnknownCount(0);
            }}
            variant="outline"
          >
            Restart Lesson
          </Button>
        </div>
      </div>
    );
  }

  const remainingCount = words.length - currentCardIndex;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-4">Lesson {lessonNumber} - Tinder Cards</h1>
        <Button 
          onClick={() => router.push('/flashcard')}
          variant="outline"
          className="mb-4"
        >
          ← Back to Lessons
        </Button>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8 max-w-2xl mx-auto">
        <div className="grid grid-cols-2  gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">{currentCardIndex}</div>
            <div className="text-sm text-gray-600">Studied</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-600">{remainingCount}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
          
        </div>
      </div>

      {/* Card Stack */}
      <div className="flex justify-center mb-8">
        <div className="relative" style={{ width: '320px', height: '400px' }}>
          {words.slice(currentCardIndex, currentCardIndex + 3).map((word, index) => (
            <TinderCard
              key={word.id}
              word={word}
              onSwipe={handleSwipe}
              isTopCard={index === 0}
              style={{
                zIndex: 3 - index,
                transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-gray-600 max-w-md mx-auto">
        <p className="text-sm">
          Swipe left or tap &ldquo;Unknown&rdquo; for words you don&apos;t know<br/>
          Swipe right or tap &ldquo;Known&rdquo; for words you know<br/>
          Tap &ldquo;Show Answer&rdquo; to see the translation and example
        </p>
      </div>
    </div>
  );
  
}

export default function TinderPage() {

  return <Suspense fallback={<div>Loading...</div>}><Tinder /></Suspense>;
}
