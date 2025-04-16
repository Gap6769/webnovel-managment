"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useNovels } from "@/hooks/useNovels"
import type { Novel } from "@/types"
import { Settings, RefreshCw, Plus } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { novels, loading, error, refreshNovels } = useNovels()

  return (
    <main className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Novels</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={() => refreshNovels()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Novel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="updates">Recent Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : (
              novels.map((novel: Novel) => (
                <Card key={novel._id}>
                  <CardHeader>
                    <CardTitle>{novel.title}</CardTitle>
                    <CardDescription>
                      {novel.author || "Unknown Author"} • {novel.status || "Unknown Status"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {novel.cover_image_url ? (
                      <img
                        src={novel.cover_image_url}
                        alt={novel.title}
                        className="w-full aspect-[2/3] object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500">No cover image</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                      <Link href={`/novel/${novel._id}`}>Details</Link>
                    </Button>
                    <Button>Update</Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="updates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : (
              [...novels]
                .sort(
                  (a: Novel, b: Novel) =>
                    new Date(b.last_updated_chapters || "").getTime() - new Date(a.last_updated_chapters || "").getTime(),
                )
                .slice(0, 4)
                .map((novel: Novel) => (
                  <Card key={novel._id}>
                    <CardHeader>
                      <CardTitle>{novel.title}</CardTitle>
                      <CardDescription>
                        {novel.author || "Unknown Author"} • {novel.status || "Unknown Status"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {novel.cover_image_url ? (
                        <img
                          src={novel.cover_image_url}
                          alt={novel.title}
                          className="w-full aspect-[2/3] object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-500">No cover image</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" asChild>
                        <Link href={`/novel/${novel._id}`}>Details</Link>
                      </Button>
                      <Button>Update</Button>
                    </CardFooter>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
