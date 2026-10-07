import prisma from "@/lib/prisma";
import { getUser, isPrivileged } from "@/utils/authentication";
import { UserRegistrationRequestSchema } from "@/types/dto/UserRegistrationRequest";
import { UserSelfUpdateRequestSchema } from "@/types/dto/UserSelfUpdateRequest";
import { UserUpdateByAdminRequestSchema } from "@/types/dto/UserUpdateByAdminRequest";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(request: NextRequest) {
    const havePrivilege = await isPrivileged(request, "users:read");

    if (!havePrivilege) {
        return NextResponse.json(
            {
                message: "You do not have the privilege to view users"
            },
            {
                status: 403
            }
        );
    }

    const pageNumberInString = request.nextUrl.searchParams.get("pageNumber") || "1";
    const pageSizeInString = request.nextUrl.searchParams.get("pageSize") || "10";

    const pageNumber = parseInt(pageNumberInString);
    const pageSize = parseInt(pageSizeInString);

    if (isNaN(pageNumber) || pageNumber < 1 || isNaN(pageSize) || pageSize < 1) {
        return NextResponse.json(
            {
                message: "Invalid pagination parameters"
            },
            {
                status: 400
            }
        );
    }

    const userCount = await prisma.user.count();
    const totalPages = Math.ceil(userCount / pageSize);

    if (totalPages > 0 && pageNumber > totalPages) {
        return NextResponse.json(
            {
                message: "Page number exceeds total pages",
                totalPages: totalPages
            },
            {
                status: 400
            }
        );
    }

    const users = await prisma.user.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true,
            lastLogin: true,
            privileges: true,
            profileImage: true
        }
    });

    return NextResponse.json(
        {
            message: "Users fetched successfully",
            users: users,
            pagination: {
                pageNumber: pageNumber,
                pageSize: pageSize,
                totalPages: totalPages,
                totalCount: userCount
            }
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsedBody = UserRegistrationRequestSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where: {
                email: parsedBody.email
            }
        });

        if (existingUser != null) {
            return NextResponse.json(
                {
                    message: "User with this email already exists"
                },
                {
                    status: 409
                }
            );
        }

        const passwordHash = await bcrypt.hash(parsedBody.password, 12);

        await prisma.user.create({
            data: {
                email: parsedBody.email,
                firstName: parsedBody.firstName,
                lastName: parsedBody.lastName,
                password: passwordHash,
                phone: parsedBody.phone
            }
        });

        return NextResponse.json(
            {
                message: "User created successfully"
            },
            {
                status: 201
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    message: error.issues[0]?.message ?? "Invalid input"
                },
                {
                    status: 400
                }
            );
        }

        return NextResponse.json(
            {
                message: "Server error"
            },
            {
                status: 500
            }
        );
    }
}

export async function PUT(request: NextRequest) {
    const requestedUser = await getUser(request);

    if (requestedUser == null) {
        return NextResponse.json(
            {
                message: "You are not logged in"
            },
            {
                status: 401
            }
        );
    }

    const id = request.nextUrl.searchParams.get("id");

    try {
        const body = await request.json();

        if (!id || requestedUser.id === id) {
            // Self-update
            UserSelfUpdateRequestSchema.parse(body);

            const targetId = requestedUser.id;

            const user = await prisma.user.findUnique({
                where: {
                    id: targetId
                }
            });

            if (user == null) {
                return NextResponse.json(
                    {
                        message: "User not found"
                    },
                    {
                        status: 404
                    }
                );
            }

            await prisma.user.update({
                where: {
                    id: targetId
                },
                data: {
                    email: body.email || user.email,
                    firstName: body.firstName || user.firstName,
                    lastName: body.lastName || user.lastName,
                    phone: body.phone || user.phone,
                    profileImage: body.profileImage || user.profileImage
                }
            });

            return NextResponse.json(
                {
                    message: "User updated successfully"
                }
            );
        } else {
            // Admin updating another user
            const havePrivilege = await isPrivileged(request, "users:edit");

            if (!havePrivilege) {
                return NextResponse.json(
                    {
                        message: "You do not have the privilege to edit other users"
                    },
                    {
                        status: 403
                    }
                );
            }

            UserUpdateByAdminRequestSchema.parse(body);

            const user = await prisma.user.findUnique({
                where: {
                    id: id
                }
            });

            if (user == null) {
                return NextResponse.json(
                    {
                        message: "User not found"
                    },
                    {
                        status: 404
                    }
                );
            }

            await prisma.user.update({
                where: {
                    id: id
                },
                data: {
                    email: body.email || user.email,
                    firstName: body.firstName || user.firstName,
                    lastName: body.lastName || user.lastName,
                    phone: body.phone || user.phone,
                    profileImage: body.profileImage || user.profileImage,
                    role: body.role || user.role,
                    status: body.status || user.status,
                    privileges: body.privileges || user.privileges
                }
            });

            return NextResponse.json(
                {
                    message: "User updated successfully"
                }
            );
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    message: error.issues[0]?.message ?? "Invalid input"
                },
                {
                    status: 400
                }
            );
        }

        return NextResponse.json(
            {
                message: "Server error"
            },
            {
                status: 500
            }
        );
    }
}