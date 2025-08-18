import { PrismaClient } from '@prisma/client'

// Ensure a single PrismaClient instance across hot reloads in dev
declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined
}

export const prisma: PrismaClient = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
	global.prisma = prisma
} 