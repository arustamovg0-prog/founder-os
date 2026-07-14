import { NextRequest, NextResponse } from "next/server";
import { codebaseMemory } from "@/lib/mcp/client";

export async function POST(req: NextRequest) {
  try {
    const { repoPath, projectName } = await req.json();

    if (!repoPath || !projectName) {
      return NextResponse.json({ error: "Missing repoPath or projectName" }, { status: 400 });
    }

    // Connect to the MCP Server
    await codebaseMemory.connect();

    // 1. Index the repository
    const indexResult = await codebaseMemory.indexRepository(repoPath);

    // 2. Get architecture analysis
    const architectureResult = await codebaseMemory.getArchitecture(projectName);

    return NextResponse.json({
      success: true,
      indexResult,
      architectureResult,
    });
  } catch (error: any) {
    console.error("MCP Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
