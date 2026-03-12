import bcrypt from "bcryptjs";
import { prisma } from "@/utils/prisma";
import { UserCreate, UserLogin, UserResponse } from "@/types/validation";
import { signToken } from "@/utils/jwt";

export const registerService = async ({ email, password, name }: UserCreate): Promise<{ user: UserResponse; token: string }> => {
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error("Email already in use");
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hash,
                name,
            },
        });

        const token = signToken({ userId: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token,
        };
    } catch (error) {
        throw error;
    }
};

export const loginService = async ({ email, password }: UserLogin): Promise<{ user: UserResponse; token: string }> => {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error("Invalid credentials");
        }

        const token = signToken({ userId: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token,
        };
    } catch (error) {
        throw error;
    }
};