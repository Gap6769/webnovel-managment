import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { Novel } from "@/types"

// Helper function to read novels from JSON file
function getNovels(): { novels: Novel[] } {
  try {
    const filePath = path.join(process.cwd(), "data", "novels.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    return JSON.parse(fileContents)
  } catch (error) {
    console.error("Error reading novels data:", error)
    return { novels: [] }
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { novels } = getNovels()
    console.log('here')

    const novel = novels.find((n) => n.id === id)

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    return NextResponse.json({ novel })
  } catch (error) {
    console.error("Error fetching novel:", error)
    return NextResponse.json({ error: "Failed to fetch novel", details: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const updateData = await request.json()

    // In a real app, you would update in a database
    // For demo purposes, we'll just return the updated data
    const updatedNovel = {
      id,
      ...updateData,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      novel: updatedNovel,
      message: "Novel updated successfully",
    })
  } catch (error) {
    console.error("Error updating novel:", error)
    return NextResponse.json({ error: "Failed to update novel", details: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // In a real app, you would delete from a database
    // For demo purposes, we'll just return success
    return NextResponse.json({
      success: true,
      message: "Novel deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting novel:", error)
    return NextResponse.json({ error: "Failed to delete novel", details: (error as Error).message }, { status: 500 })
  }
}
