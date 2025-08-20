import { PrismaClient, CallStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	const calls = await prisma.call.findMany()
	for (const c of calls) {
		if (!c.completedAt) continue
		const created = c.createdAt
		let durationSec: number | null = null
		if (c.status === CallStatus.COMPLETED) {
			durationSec = 60 + Math.floor(Math.random() * 61)
		} else if (c.status === CallStatus.FAILED || c.status === CallStatus.CANCELLED) {
			durationSec = 15 + Math.floor(Math.random() * 41)
		}
		if (durationSec) {
			await prisma.call.update({
				where: { id: c.id },
				data: { completedAt: new Date(created.getTime() + durationSec * 1000) },
			})
		}
	}
	console.log('Durations normalized')
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	}) 