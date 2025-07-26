"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function FlashcardCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonNumber = parseInt(searchParams.get("lesson") ?? "1");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);

  const { data: words, isLoading, error } = api.words.getWordsByLesson.useQuery({
    lessonNumber,
    wordsPerLesson: 20,
  });

  const currentWord = words?.[currentCardIndex];

  const playAudio = async (audioPath: string, setLoadingState: (loading: boolean) => void) => {
    setLoadingState(true);
    const audio = new Audio(audioPath);
    
    try {
      await audio.play();
      audio.addEventListener('ended', () => setLoadingState(false));
      audio.addEventListener('error', () => setLoadingState(false));
    } catch (error) {
      console.error("Error playing audio:", error);
      setLoadingState(false);
    }
  };

  const playWordAudio = async () => {
    if (currentWord?.no) {
      const paddedNo = currentWord.no.toString().padStart(4, '0');
      await playAudio(`${process.env.NEXT_PUBLIC_AUDIO_URL}/row_${paddedNo}_word.mp3?raw=true`, setIsPlayingWord);
    }
  };

  const playSentenceAudio = async () => {
    if (currentWord?.no) {
      const paddedNo = currentWord.no.toString().padStart(4, '0');
      await playAudio(`${process.env.NEXT_PUBLIC_AUDIO_URL}/row_${paddedNo}_sentence.mp3?raw=true`, setIsPlayingSentence);
    }
  };

  const handleNext = () => {
    if (words && currentCardIndex < words.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowTranslation(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowTranslation(false);
    }
  };

  const handleBackToLessons = () => {
    router.push("/flashcard");
  };

  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading words...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">Error loading words: {error.message}</div>
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl">No words found for this lesson.</div>
      </div>
    );
  }

  if (currentCardIndex >= words.length) {
    router.push(`/flashcard/card-end?lesson=${lessonNumber}`);
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={handleBackToLessons}>
            ← Back to Lessons
          </Button>
          <h1 className="text-2xl font-bold">Lesson {lessonNumber}</h1>
          <div className="text-sm text-gray-600">
            {currentCardIndex + 1} / {words.length}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-3xl">
              {currentWord?.tagalog}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showTranslation && (
              <div className="space-y-4">
                <div className="flex justify-center"> 
                  <p className="text-lg">{currentWord?.english}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Translation:</h3>
                  <p className="text-lg">{currentWord?.translation}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Example:</h3>
                  <p className="text-lg">{currentWord?.example}</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={toggleTranslation}
            >
              {showTranslation ? "Hide" : "Show"} meaning
            </Button>
            <Button 
              variant="outline" 
              onClick={playWordAudio}
              disabled={isPlayingWord}
            >
              {isPlayingWord ? "Playing..." : "Word"}
            </Button>
            <Button 
              variant="outline" 
              onClick={playSentenceAudio}
              disabled={isPlayingSentence}
            >
              {isPlayingSentence ? "Playing..." : "Sentence"}
            </Button>
          </CardFooter>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentCardIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentCardIndex === words.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardCardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FlashcardCardContent />
    </Suspense>
  );
}
