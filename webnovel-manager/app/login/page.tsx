import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login - WebNovel Manager",
  description: "Login to your WebNovel Manager account",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="h-6 w-6" />
          <span>WebNovel Manager</span>
        </Link>
        <p className="text-muted-foreground mt-1">Track and manage your favorite webnovels and manhwas</p>
      </div>
      <LoginForm />
    </div>
  )
}
