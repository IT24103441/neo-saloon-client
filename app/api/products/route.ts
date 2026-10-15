import { NextRequest, NextResponse } from "next/server";
import { isPrivileged } from "@/utils/authentication";

export async function GET(request: NextRequest) {

}

export async function POST(request: NextRequest) {
    const hasPrivilege = await isPrivileged(request, "products:add")

    if (hasPrivilege) {

        const body = await request.json()

    } else {
        return NextResponse.json({ message: "You do not have the required privilege to add a product" }, { status: 403 })
    }
}