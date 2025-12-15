import { NextRequest, NextResponse } from "next/server";
import { getGameDetails } from "@/lib/igdb";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name");

    if (!name) {
        return NextResponse.json({ error: "Name parameter is required" }, { status: 400 });
    }

    try {
        const gameData = await getGameDetails(name);

        if (!gameData) {
            return NextResponse.json({ error: "Game not found" }, { status: 404 });
        }

        return NextResponse.json(gameData);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
