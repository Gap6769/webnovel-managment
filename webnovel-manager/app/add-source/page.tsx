"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AddSource() {
  const [sourceType, setSourceType] = useState("preset")

  return (
    <main className="container mx-auto p-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add New Source</h1>
      </div>

      <Tabs defaultValue="preset" onValueChange={setSourceType} className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preset">Preset Source</TabsTrigger>
          <TabsTrigger value="custom">Custom Source</TabsTrigger>
        </TabsList>

        <TabsContent value="preset" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Select a Preset Source</CardTitle>
              <CardDescription>Choose from our list of pre-configured sources for easy setup.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="source-type">Content Type</Label>
                  <RadioGroup defaultValue="both" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manhwa" id="manhwa" />
                      <Label htmlFor="manhwa">Manhwa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="webnovel" id="webnovel" />
                      <Label htmlFor="webnovel">Webnovel</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both">Both</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="source">Source Website</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webnovel">WebNovel.com</SelectItem>
                      <SelectItem value="mangadex">MangaDex</SelectItem>
                      <SelectItem value="novelupdates">NovelUpdates</SelectItem>
                      <SelectItem value="tapas">Tapas</SelectItem>
                      <SelectItem value="webtoons">Webtoons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="update-frequency">Update Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications for new chapters</p>
                  </div>
                  <Switch id="notifications" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure Custom Source</CardTitle>
              <CardDescription>Set up a custom scraper for a website not in our presets.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="source-name">Source Name</Label>
                  <Input id="source-name" placeholder="e.g., My Favorite Manhwa Site" />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="base-url">Base URL</Label>
                  <Input id="base-url" placeholder="https://example.com" />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="content-type">Content Type</Label>
                  <RadioGroup defaultValue="manhwa" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manhwa" id="custom-manhwa" />
                      <Label htmlFor="custom-manhwa">Manhwa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="webnovel" id="custom-webnovel" />
                      <Label htmlFor="custom-webnovel">Webnovel</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="title-selector">CSS Selector for Title</Label>
                  <Input id="title-selector" placeholder=".novel-title, h1.title, etc." />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="chapter-selector">CSS Selector for Chapters List</Label>
                  <Input id="chapter-selector" placeholder=".chapter-list li, .episodes a, etc." />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="content-selector">CSS Selector for Chapter Content</Label>
                  <Input id="content-selector" placeholder=".chapter-content, .episode-body, etc." />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="update-frequency-custom">Update Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="custom-notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications for new chapters</p>
                  </div>
                  <Switch id="custom-notifications" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Source
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
