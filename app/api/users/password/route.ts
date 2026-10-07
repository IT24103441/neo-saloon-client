import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {

    const body = await request.json()

    const password = body.password

}