"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link"
import { ArrowLeft, BookOpen, Calendar, Clock, Download, Languages, ExternalLink, RefreshCw, Settings } from "lucide-react"
import { use } from "react"
import { useToast } from "@/hooks/use-toast"
import { novelsAPI, chaptersAPI } from "@/services/api"
import { useNovel } from "@/hooks/useNovels"
import type { NovelDetail, Chapter, ManhwaResponse } from "@/types"
import { ManhwaReader } from '@/components/reader/ManhwaReader';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Novel {
  _id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  description: string | null;
  source_url: string;
  source_name: string;
  tags: string[];
  status: string | null;
  chapters: {
    title: string;
    chapter_number: number;
    chapter_title: string | null;
    url: string;
    read: boolean;
    downloaded: boolean;
  }[];
  added_at: string;
  last_updated_api: string;
  last_updated_chapters: string;
  last_scraped?: string;
  next_update?: string;
  update_schedule?: string;
}

export default function NovelDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { novel, chapters, loading, error, updateReadingProgress, isReversed, toggleSortOrder, fetchChaptersFromSource, fetchingChapters } = useNovel(resolvedParams.id);
  const [activeTab, setActiveTab] = useState("info");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedChapters, setLoadedChapters] = useState<Chapter[]>([]);
  const [startChapter, setStartChapter] = useState<number>(1);
  const [endChapter, setEndChapter] = useState<number>(1);
  const [manhwaData, setManhwaData] = useState<ManhwaResponse | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const chaptersRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize chapters when chapters data is loaded
  useEffect(() => {
    if (chapters && loadedChapters.length === 0) {
      setLoadedChapters(chapters);
    }
  }, [chapters]);

  // Load more chapters when scrolling
  useEffect(() => {
    const container = chaptersRef.current;
    if (!container || activeTab !== "chapters") return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop <= clientHeight * 1.2 && !loadingMore && hasMore) {
        loadMoreChapters();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [loadingMore, hasMore, activeTab]);

  const loadMoreChapters = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await chaptersAPI.getByNovelId(
        resolvedParams.id,
        nextPage,
        50,
        isReversed ? "desc" : "asc"
      );

      if (response.success && response.data) {
        const newChapters = response.data.chapters;
        if (newChapters.length === 0) {
          setHasMore(false);
        } else {
          setCurrentPage(nextPage);
          setLoadedChapters(prev => {
            const existingChapterNumbers = new Set(prev.map(ch => ch.chapter_number));
            const uniqueNewChapters = newChapters.filter(ch => !existingChapterNumbers.has(ch.chapter_number));
            return [...prev, ...uniqueNewChapters];
          });
        }
      }
    } catch (error) {
      console.error("Error loading more chapters:", error);
      toast({
        title: "Error",
        description: "Failed to load more chapters",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  // Reset chapters when sort order changes
  useEffect(() => {
    if (chapters) {
      setLoadedChapters(chapters);
      setCurrentPage(1);
      setHasMore(true);
    }
  }, [isReversed, chapters]);

  const handleDownloadChapter = async (chapterNumber: number, translate: boolean = false) => {
    try {
      const response = await chaptersAPI.downloadSingle(
        resolvedParams.id,
        chapterNumber,
        translate ? "es" : "en"
      )

      if (!response.success) {
        throw new Error(response.error || "Failed to download chapter")
      }

      // Handle the blob response
      const blob = response.data
      if (!blob) throw new Error("No data received")

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `chapter_${chapterNumber}${translate ? '_es' : ''}.epub`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: `Chapter ${chapterNumber} is being downloaded`,
      })
    } catch (error) {
      console.error("Error downloading chapter:", error)
      toast({
        title: "Error",
        description: "Failed to download chapter",
        variant: "destructive",
      })
    }
  }

  const handleDownloadRange = async (translate: boolean = false) => {
    if (!novel) return;

    try {
      const chapterNumbers = Array.from(
        { length: endChapter - startChapter + 1 },
        (_, i) => startChapter + i
      );

      const response = await chaptersAPI.downloadMultiple(
        resolvedParams.id,
        chapterNumbers,
        translate ? "es" : "en"
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to download chapters");
      }

      // Handle the blob response
      const blob = response.data;
      if (!blob) throw new Error("No data received");

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${novel.title}_chapters_${startChapter}-${endChapter}${translate ? '_es' : ''}.epub`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Chapters ${startChapter} to ${endChapter} are being downloaded`,
      });
    } catch (error) {
      console.error("Error downloading chapters:", error);
      toast({
        title: "Error",
        description: "Failed to download chapters",
        variant: "destructive",
      });
    }
  };

  const handleDownloadUnread = async (translate: boolean = false) => {
    if (!chapters || chapters.length === 0) return

    try {
      const unreadChapters = chapters.filter(chapter => !chapter.read)
      if (unreadChapters.length === 0) {
        toast({
          title: "No unread chapters",
          description: "All chapters have been read",
        })
        return
      }

      const chapterNumbers = unreadChapters.map(chapter => chapter.chapter_number)
      const response = await chaptersAPI.downloadMultiple(
        resolvedParams.id,
        chapterNumbers,
        translate ? "es" : "en"
      )

      if (!response.success) {
        throw new Error(response.error || "Failed to download unread chapters")
      }

      toast({
        title: "Download started",
        description: `Unread chapters are being downloaded`,
      })
    } catch (error) {
      console.error("Error downloading unread chapters:", error)
      toast({
        title: "Error",
        description: "Failed to download unread chapters",
        variant: "destructive",
      })
    }
  }

  const handleFetchFromSource = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetchChaptersFromSource();
      toast({
        title: "Success",
        description: "Chapters updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update chapters",
        variant: "destructive",
      });
    }
  };

  const handleReadChapter = async (chapterNumber: number) => {
    try {
      setSelectedChapter(chapterNumber);
      const response = await chaptersAPI.getChapterContent(resolvedParams.id, chapterNumber);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch chapter content');
      }

      setManhwaData(response.data);
      setActiveTab("reader");
      
      // Update reading progress
      // await updateReadingProgress(chapterNumber);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load chapter",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto p-4 py-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </main>
    )
  }

  if (error || !novel) {
    return (
      <main className="container mx-auto p-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Novel not found</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{novel.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <div className="flex flex-col items-center">
            <img
              src={novel.cover_image_url || "/placeholder.svg"}
              alt={novel.title}
              className="w-[200px] h-[300px] object-cover rounded-md mb-4"
            />
            <div className="flex gap-2 mb-4 w-full justify-center">
              <Button asChild>
                <Link href={`/reader/${resolvedParams.id}`}>Read Latest</Link>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={(e) => handleFetchFromSource(e)}
                disabled={fetchingChapters}
              >
                {fetchingChapters ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="sr-only">Update Now</span>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/novel/${resolvedParams.id}/settings`}>
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Link>
              </Button>
            </div>
            <Card className="w-full">
              <CardContent className="p-4">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-medium">{novel.status || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Chapters</span>
                    <span className="text-sm font-medium">{novel.total_chapters}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <div className="flex items-center">
                      <span className="mr-1 text-sm font-medium">{novel.source_name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm font-medium">
                      {new Date(novel.last_updated_chapters || "").toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="settings">Scraping Settings</TabsTrigger>
              {novel?.type === 'manhwa' && <TabsTrigger value="reader">Reader</TabsTrigger>}
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <div className="grid gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Synopsis</h2>
                  <p className="text-muted-foreground">{novel.description || 'No description available'}</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-2">Details</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h3 className="text-sm font-medium">Author</h3>
                      <p className="text-muted-foreground">{novel.author || 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-2">Genres</h2>
                  <div className="flex flex-wrap gap-2">
                    {novel.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-2">Reading Progress</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Chapter {novel.read_chapters} of {novel.total_chapters}</span>
                      <span>{Math.round(novel.reading_progress* 100) / 100}%</span>
                    </div>
                    <Progress value={novel.reading_progress} />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-2">Download Options</h2>
                  <div className="grid gap-4">
                    <div className="flex gap-2">
                      <Button onClick={() => handleDownloadRange(false)}>
                        Download All
                      </Button>
                      <Button variant="outline" onClick={() => handleDownloadRange(true)}>
                        Download All (Spanish)
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleDownloadUnread(false)}>
                        Download Unread
                      </Button>
                      <Button variant="outline" onClick={() => handleDownloadUnread(true)}>
                        Download Unread (Spanish)
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={novel?.total_chapters}
                        value={startChapter}
                        onChange={(e) => setStartChapter(Number(e.target.value))}
                        className="w-24 px-2 py-1 border rounded"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        min={1}
                        max={novel?.total_chapters}
                        value={endChapter}
                        onChange={(e) => setEndChapter(Number(e.target.value))}
                        className="w-24 px-2 py-1 border rounded"
                      />
                      <Button onClick={() => handleDownloadRange(false)}>
                        Download Range
                      </Button>
                      <Button variant="outline" onClick={() => handleDownloadRange(true)}>
                        Download Range (Spanish)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chapters" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Chapters</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSortOrder}
                >
                  {isReversed ? 'Show Oldest First' : 'Show Newest First'}
                </Button>
              </div>
              <div className="overflow-auto max-h-[600px] chapters-container" ref={chaptersRef}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chapter</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadedChapters.length > 0 ? (
                      loadedChapters.map((chapter) => (
                        <TableRow key={chapter.chapter_number}>
                          <TableCell>{chapter.chapter_number}</TableCell>
                          <TableCell>{chapter.chapter_title || chapter.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {chapter.read ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Read</Badge>
                              ) : (
                                <Badge variant="secondary">Unread</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {novel?.type === 'manhwa' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleReadChapter(chapter.chapter_number)}
                                >
                                  <BookOpen className="h-4 w-4" />
                                  <span className="sr-only">Read</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownloadChapter(chapter.chapter_number)}
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownloadChapter(chapter.chapter_number, true)}
                              >
                                <Languages className="h-4 w-4" />
                                <span className="sr-only">Download Spanish</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          {loading ? "Loading chapters..." : "No chapters available"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <div className="grid gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Scraping Configuration</h2>
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid gap-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Update Schedule</h3>
                            <p className="text-sm text-muted-foreground">Check for new chapters daily</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Change
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Last Scraped</h3>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(novel?.last_scraped || novel?.last_updated_api || "").toLocaleDateString()}
                              <Clock className="h-3 w-3 mx-1" />
                              {new Date(novel?.last_scraped || novel?.last_updated_api || "").toLocaleTimeString()}
                            </p>
                          </div>
                          <Button size="sm">Update Now</Button>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Source URL</h3>
                            <p className="text-sm text-muted-foreground">
                              {novel?.source_url}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reader" className="mt-4">
              {manhwaData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      Chapter {selectedChapter}
                    </h2>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("chapters")}
                    >
                      Back to Chapters
                    </Button>
                  </div>
                  <ManhwaReader
                    images={manhwaData.images}
                    title={`${novel?.title} - Chapter ${selectedChapter}`}
                    backUrl={`/novel/${resolvedParams.id}`}
                  />
                </div>
              ) : (
                <div className="flex h-[80vh] items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">No chapter selected</h2>
                    <p className="mt-2 text-muted-foreground">Select a chapter from the chapters tab to start reading</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}