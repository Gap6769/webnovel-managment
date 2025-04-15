"use client";
import { useRef } from "react";
import Link from "next/link"
import { ArrowLeft, BookOpen, Calendar, Clock, Download, ExternalLink, RefreshCw, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { use } from "react"
import { useToast } from "@/hooks/use-toast"
import { novelsAPI } from "@/services/api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2 } from "lucide-react"




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
}

export default function NovelDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isReversed, setIsReversed] = useState(true);
  const [activeTab, setActiveTab] = useState("information");
  const [displayedChapters, setDisplayedChapters] = useState(30);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

const chaptersRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const response = await fetch(`http://localhost:8001/api/v1/novels/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch novel');
        }
        const data = await response.json();
        setNovel(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNovel();
  }, [resolvedParams.id]);

  useEffect(() => {
    console.log("activeTab changed:", activeTab);
    const container = chaptersRef.current;
    if (!container || activeTab !== "chapters") return;

    const handleScroll = () => {
      console.log("Scroll event triggered");
      const { scrollTop, scrollHeight, clientHeight } = container;
      console.log("Scroll values:", { scrollTop, scrollHeight, clientHeight });
      if (scrollHeight - scrollTop <= clientHeight * 1.2 && !loadingMore) {
        console.log("Loading more chapters");
        setLoadingMore(true);
        setDisplayedChapters(prev => prev + 30);
        setLoadingMore(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [loadingMore, activeTab]);
  

  const handleDownloadChapter = async (chapterNumber: number) => {
    try {
      const response = await novelsAPI.download(
        novel!._id,
        undefined,
        undefined,
        chapterNumber
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to download chapter");
      }

      // Create a blob URL and trigger download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chapter_${chapterNumber}.epub`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Chapter ${chapterNumber} is being downloaded`,
      });
    } catch (error) {
      console.error("Error downloading chapter:", error);
      toast({
        title: "Error",
        description: "Failed to download chapter",
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
    );
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
    );
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
                <Link href={`/reader/${novel._id}`}>Read Latest</Link>
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Update Now</span>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/novel/${novel._id}/settings`}>
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
                    <Badge variant={novel.status === "Ongoing" ? "default" : "secondary"}>{novel.status || "Unknown"}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <div className="flex items-center">
                      <span className="mr-1">{novel.source_name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span>{new Date(novel.last_updated_chapters).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="information" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="information">Information</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="settings">Scraping Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="information" className="mt-4">
              <div className="grid gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Novel Information</h2>
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid gap-3">
                        <div>
                          <h3 className="font-medium">Title</h3>
                          <p className="text-sm text-muted-foreground">{novel.title}</p>
                        </div>
                        <div>
                          <h3 className="font-medium">Author</h3>
                          <p className="text-sm text-muted-foreground">{novel.author || 'Unknown'}</p>
                        </div>
                        <div>
                          <h3 className="font-medium">Description</h3>
                          <p className="text-sm text-muted-foreground">{novel.description || 'No description available'}</p>
                        </div>
                        <div>
                          <h3 className="font-medium">Status</h3>
                          <p className="text-sm text-muted-foreground">{novel.status || 'Unknown'}</p>
                        </div>
                        <div>
                          <h3 className="font-medium">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {novel.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chapters" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Chapters</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReversed(!isReversed)}
                  >
                    {isReversed ? 'Show Oldest First' : 'Show Newest First'}
                  </Button>
                </div>
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
                    {[...novel.chapters]
                      .sort((a, b) => isReversed ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number)
                      .slice(0, displayedChapters)
                      .map((chapter) => (
                        <TableRow key={chapter.chapter_number}>
                          <TableCell>{chapter.chapter_number}</TableCell>
                          <TableCell>{chapter.chapter_title || chapter.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {chapter.read && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {chapter.downloaded && <Download className="h-4 w-4 text-blue-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadChapter(chapter.chapter_number)}
                            >
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
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
                            <h3 className="font-medium">Last Updated</h3>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(novel.last_updated_api).toLocaleDateString()}
                              <Clock className="h-3 w-3 mx-1" />
                              {new Date(novel.last_updated_api).toLocaleTimeString()}
                            </p>
                          </div>
                          <Button size="sm">Update Now</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
