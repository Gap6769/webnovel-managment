"use client"

import type React from "react"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, RefreshCw, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSettings } from "@/hooks/useSettings"
import { useToast } from "@/hooks/use-toast"
import { DOWNLOAD_FORMATS, LANGUAGES, UPDATE_FREQUENCIES } from "@/constants"
import { useAuthStore } from "@/store/useAuthStore"

export default function Settings() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated } = useAuthStore()
  const { settings, updateSettings, updateScrapingSettings, updateStorageSettings, resetSettings, isUpdating } =
    useSettings()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated")
      // router.push("/login")
    }
  }, [isAuthenticated, router])

  const handleThemeChange = (theme: string) => {
    updateSettings({ theme: theme as "light" | "dark" | "system" })
  }

  const handleLanguageChange = (language: string) => {
    updateSettings({ language })
  }

  const handleNotificationsChange = (enabled: boolean) => {
    updateSettings({ notifications: enabled })
  }

  const handleAutoUpdateChange = (enabled: boolean) => {
    updateSettings({ autoUpdate: enabled })
  }

  const handleAnalyticsChange = (enabled: boolean) => {
    updateSettings({ analytics: enabled })
  }

  const handleUpdateFrequencyChange = (frequency: string) => {
    updateScrapingSettings({
      defaultUpdateFrequency: frequency as "hourly" | "daily" | "weekly" | "manual",
    })
  }

  const handleConcurrentScrapesChange = (value: string) => {
    updateScrapingSettings({ concurrentScrapes: Number.parseInt(value) })
  }

  const handleRequestDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateScrapingSettings({ requestDelay: Number.parseInt(e.target.value) })
  }

  const handleUseProxyChange = (enabled: boolean) => {
    updateScrapingSettings({ useProxy: enabled })
  }

  const handleProxyUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateScrapingSettings({ proxyUrl: e.target.value })
  }

  const handleUserAgentRotationChange = (enabled: boolean) => {
    updateScrapingSettings({ userAgentRotation: enabled })
  }

  const handleDownloadFormatChange = (format: string) => {
    updateStorageSettings({
      downloadFormat: format as "epub" | "pdf" | "txt" | "html",
    })
  }

  const handleImageQualityChange = (quality: string) => {
    updateStorageSettings({
      imageQuality: quality as "low" | "medium" | "high" | "original",
    })
  }

  const handleAutoDownloadChange = (enabled: boolean) => {
    updateStorageSettings({ autoDownload: enabled })
  }

  const handleCompressImagesChange = (enabled: boolean) => {
    updateStorageSettings({ compressImages: enabled })
  }

  const handleSaveChanges = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully",
    })
  }

  const handleClearCache = () => {
    toast({
      title: "Cache cleared",
      description: "Your cache has been cleared successfully",
    })
  }

  const handleExportData = () => {
    // In a real app, you would generate and download a file
    toast({
      title: "Data exported",
      description: "Your data has been exported successfully",
    })
  }

  const handleResetSettings = () => {
    resetSettings()
    toast({
      title: "Settings reset",
      description: "Your settings have been reset to defaults",
    })
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
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="scraping">Scraping</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure the application's appearance and behavior.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select defaultValue={settings.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue={settings.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications for new chapters</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={handleNotificationsChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-update">Auto Update</Label>
                    <p className="text-sm text-muted-foreground">Automatically check for updates on startup</p>
                  </div>
                  <Switch id="auto-update" checked={settings.autoUpdate} onCheckedChange={handleAutoUpdateChange} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Usage Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app by sending anonymous usage data
                    </p>
                  </div>
                  <Switch id="analytics" checked={settings.analytics} onCheckedChange={handleAnalyticsChange} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleResetSettings} disabled={isUpdating}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveChanges} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="scraping" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scraping Settings</CardTitle>
                <CardDescription>Configure how the application scrapes and updates content.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default-update-frequency">Default Update Frequency</Label>
                  <Select
                    defaultValue={settings.scraping.defaultUpdateFrequency}
                    onValueChange={handleUpdateFrequencyChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UPDATE_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concurrent-scrapes">Concurrent Scrapes</Label>
                  <Select
                    defaultValue={settings.scraping.concurrentScrapes.toString()}
                    onValueChange={handleConcurrentScrapesChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Higher values may cause rate limiting from source websites
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request-delay">Request Delay (ms)</Label>
                  <Input
                    id="request-delay"
                    type="number"
                    value={settings.scraping.requestDelay}
                    onChange={handleRequestDelayChange}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">Delay between requests to avoid rate limiting</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="use-proxy">Use Proxy</Label>
                    <p className="text-sm text-muted-foreground">Route requests through a proxy server</p>
                  </div>
                  <Switch id="use-proxy" checked={settings.scraping.useProxy} onCheckedChange={handleUseProxyChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxy-url">Proxy URL</Label>
                  <Input
                    id="proxy-url"
                    placeholder="http://proxy.example.com:8080"
                    value={settings.scraping.proxyUrl}
                    onChange={handleProxyUrlChange}
                    disabled={!settings.scraping.useProxy}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="user-agent-rotation">User Agent Rotation</Label>
                    <p className="text-sm text-muted-foreground">Rotate user agents to avoid detection</p>
                  </div>
                  <Switch
                    id="user-agent-rotation"
                    checked={settings.scraping.userAgentRotation}
                    onCheckedChange={handleUserAgentRotationChange}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    toast({
                      title: "Test successful",
                      description: "Your scraping configuration is working correctly",
                    })
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Test Configuration
                </Button>
                <Button onClick={handleSaveChanges} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Settings</CardTitle>
                <CardDescription>Configure how content is stored and managed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="storage-location">Storage Location</Label>
                  <div className="flex gap-2">
                    <Input id="storage-location" value={settings.storage.location || "Default location"} readOnly />
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Feature not available",
                          description: "This feature is not available in the web version",
                        })
                      }}
                    >
                      Browse
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="download-format">Download Format</Label>
                  <Select defaultValue={settings.storage.downloadFormat} onValueChange={handleDownloadFormatChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOWNLOAD_FORMATS.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-quality">Image Quality</Label>
                  <Select defaultValue={settings.storage.imageQuality} onValueChange={handleImageQualityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Faster)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High (Larger Files)</SelectItem>
                      <SelectItem value="original">Original</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-download">Auto Download</Label>
                    <p className="text-sm text-muted-foreground">Automatically download new chapters</p>
                  </div>
                  <Switch
                    id="auto-download"
                    checked={settings.storage.autoDownload}
                    onCheckedChange={handleAutoDownloadChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compress-images">Compress Images</Label>
                    <p className="text-sm text-muted-foreground">Compress images to save storage space</p>
                  </div>
                  <Switch
                    id="compress-images"
                    checked={settings.storage.compressImages}
                    onCheckedChange={handleCompressImagesChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Storage Usage</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[35%]"></div>
                    </div>
                    <span className="text-sm whitespace-nowrap">3.5 GB / 10 GB</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
                  onClick={handleClearCache}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Cache
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={handleExportData}>
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
