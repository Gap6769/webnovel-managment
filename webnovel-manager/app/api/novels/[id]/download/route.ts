import { NextRequest, NextResponse } from "next/server"
import { novelsAPI } from "@/services/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const startChapter = searchParams.get("start_chapter")
    const endChapter = searchParams.get("end_chapter")
    const singleChapter = searchParams.get("single_chapter")

    // Convertir los parámetros a números si existen
    const startChapterNum = startChapter ? parseInt(startChapter) : undefined
    const endChapterNum = endChapter ? parseInt(endChapter) : undefined
    const singleChapterNum = singleChapter ? parseInt(singleChapter) : undefined

    // Llamar al servicio de API con los parámetros convertidos
    const response = await novelsAPI.download(
      params.id,
      startChapterNum,
      endChapterNum,
      singleChapterNum
    )

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to download chapters" },
        { status: 500 }
      )
    }

    // Obtener el blob del archivo
    const blob = response.data

    // Devolver el archivo EPUB
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="novel-${params.id}.epub"`
      }
    })
  } catch (error) {
    console.error("Error downloading chapters:", error)
    return NextResponse.json(
      { error: "Failed to download chapters" },
      { status: 500 }
    )
  }
} 