import { getUser } from "@/utils/authentication";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {

    const user = await getUser(request)

    console.log("User: ", user)

}