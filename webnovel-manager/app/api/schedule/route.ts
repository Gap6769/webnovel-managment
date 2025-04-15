import { NextResponse } from "next/server"

// This would be connected to a real database in a production app
const scheduledTasks = [
  {
    id: "task1",
    novelId: 1,
    frequency: "daily",
    lastRun: "2023-04-15T10:30:00Z",
    nextRun: "2023-04-16T10:30:00Z",
    status: "active",
  },
  {
    id: "task2",
    novelId: 2,
    frequency: "weekly",
    lastRun: "2023-04-10T08:15:00Z",
    nextRun: "2023-04-17T08:15:00Z",
    status: "active",
  },
]

export async function GET() {
  return NextResponse.json({
    tasks: scheduledTasks,
  })
}

export async function POST(request: Request) {
  try {
    const { novelId, frequency } = await request.json()

    if (!novelId || !frequency) {
      return NextResponse.json({ error: "Novel ID and frequency are required" }, { status: 400 })
    }

    // In a real app, you would save this to a database
    const newTask = {
      id: `task${Date.now()}`,
      novelId,
      frequency,
      lastRun: null,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: "active",
    }

    return NextResponse.json({
      success: true,
      task: newTask,
      message: "Schedule created successfully",
    })
  } catch (error) {
    console.error("Scheduling error:", error)
    return NextResponse.json({ error: "Failed to create schedule", details: (error as Error).message }, { status: 500 })
  }
}
