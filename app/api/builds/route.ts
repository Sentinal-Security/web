import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BUILDS_FILE = path.join(process.cwd(), "public", "builds", "builds.json");
const ACCESS_PASSWORD = "seanisbtter";

export interface BuildRecord {
  id: string;
  name: string;
  type: string;
  branch: string;
  commit: string;
  downloadUrl: string;
  finishedAt: string;
}

function getBuilds(): BuildRecord[] {
  try {
    if (!fs.existsSync(BUILDS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BUILDS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveBuilds(builds: BuildRecord[]) {
  const dir = path.dirname(BUILDS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(BUILDS_FILE, JSON.stringify(builds, null, 2), "utf-8");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  if (password !== ACCESS_PASSWORD) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Invalid password" },
      { status: 401 }
    );
  }

  const builds = getBuilds();
  return NextResponse.json({ success: true, builds });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, name, type, branch, commit, downloadUrl, finishedAt } = body;

    if (password !== ACCESS_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid password" },
        { status: 401 }
      );
    }

    if (!name || !downloadUrl) {
      return NextResponse.json(
        { success: false, message: "Build name and downloadUrl are required" },
        { status: 400 }
      );
    }

    const newBuild: BuildRecord = {
      id: `build-${Date.now()}`,
      name,
      type: type || "Android APK",
      branch: branch || "development",
      commit: commit ? commit.slice(0, 7) : "HEAD",
      downloadUrl,
      finishedAt: finishedAt || new Date().toISOString(),
    };

    const builds = getBuilds();
    builds.unshift(newBuild);
    saveBuilds(builds);

    return NextResponse.json({ success: true, message: "Build registered successfully", build: newBuild });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
