import { getUser } from "@/utils/authentication";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {

    const user = await getUser(request);

    console.log("User: ", user);

    console.log("GET request received at /api/products");

}