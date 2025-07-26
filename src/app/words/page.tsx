"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface Word {
  id: number;
  no: number;
  tagalog: string;
  english: string;
  example: string;
  translation: string;
  chunk: string;
  audio1: string | null;
  audio2: string | null;
  createdAt: Date;
}

export default function WordsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [allWords, setAllWords] = useState<Word[]>([]);

  const wordsQuery = api.words.getWords.useQuery({
    page: currentPage,
    limit: 20,
    search: debouncedSearch,
    orderBy: "id",
    orderDirection: "asc",
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setAllWords([]);
    setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const handleLoadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(prev => prev + 1);
  };

  // Update allWords when new data is fetched
  React.useEffect(() => {
    const words = wordsQuery.data?.words;
    if (words) {
      if (currentPage === 1) {
        setAllWords(words);
      } else {
        setAllWords(prev => [...prev, ...words]);
      }
    }
  }, [wordsQuery.data?.words, currentPage]);

  // Reset allWords when search changes
  React.useEffect(() => {
    if (debouncedSearch !== search) {
      setAllWords([]);
    }
  }, [debouncedSearch, search]);

  if (wordsQuery.error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error loading words: {wordsQuery.error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = wordsQuery.isLoading;
  const data = wordsQuery.data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tagalog Words</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search words (Tagalog, English, or Translation)..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-w-md"
            />
          </div>

          {isLoading && currentPage === 1 ? (
            <div className="text-center py-8">
              <p>Loading words...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allWords.map((word: Word) => (
                  <Card key={word.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{word.tagalog}</h3> 
                        </div>
                        <div>
                          <p className="font-medium">{word.english}</p> 
                        </div>
                      </div>
                            <div className="flex justify-between items-start">
                            <div>
                          <p className="text-lg">{word.example}</p> 
                        </div>
                        <div>
                          <p className="font-medium">{word.translation}</p> 
                        </div>
                        
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      No: {word.no} | Chunk: {word.chunk}
                    </div>
                  </Card>
                ))}
              </div>

              {isLoading && currentPage > 1 && (
                <div className="text-center py-4">
                  <p>Loading more words...</p>
                </div>
              )}

              {data?.pagination && allWords.length < data.pagination.total && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    className="px-6"
                    disabled={isLoading}
                  >
                    More
                  </Button>
                </div>
              )}

              {data?.pagination && (
                <div className="text-center mt-4 text-sm text-muted-foreground">
                  Showing {allWords.length} of {data.pagination.total} words
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
