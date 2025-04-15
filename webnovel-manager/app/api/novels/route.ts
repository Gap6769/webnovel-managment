import { NextResponse } from "next/server"
import { novelsAPI } from "@/services/api"

export async function GET() {
  try {
    const response = await novelsAPI.getAll()
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to fetch novels" },
        { status: 500 }
      )
    }
    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error fetching novels:", error)
    return NextResponse.json(
      { error: "Failed to fetch novels", details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const novelData = await request.json()

    // Validate required fields
    if (!novelData.title || !novelData.type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 })
    }

    const response = await novelsAPI.create(novelData)
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to create novel" },
        { status: 500 }
      )
    }

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error creating novel:", error)
    return NextResponse.json(
      { error: "Failed to create novel", details: (error as Error).message },
      { status: 500 }
    )
  }
}
