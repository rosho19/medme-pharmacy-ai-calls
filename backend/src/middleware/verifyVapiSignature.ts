import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

function timingSafeEqualStr(a: string, b: string): boolean {
	const aBuf = Buffer.from(a)
	const bBuf = Buffer.from(b)
	if (aBuf.length !== bBuf.length) return false
	return crypto.timingSafeEqual(aBuf, bBuf)
}

function extractSignature(req: Request): string | undefined {
	const headerNames = [
		'x-vapi-signature',
		'x-vapi-signature-v1',
		'vapi-signature',
		'x-signature',
	]
	for (const name of headerNames) {
		const val = req.header(name)
		if (val) return val
	}
	return undefined
}

function normalizeSignature(sig: string): string {
	// Support formats like `sha256=...` or pure hex/base64
	const parts = sig.split('=')
	return parts.length === 2 ? parts[1] : sig
}

export function verifyVapiSignature(req: Request, res: Response, next: NextFunction): void {
	const secret = process.env.VAPI_WEBHOOK_SECRET
	if (!secret) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn('VAPI_WEBHOOK_SECRET is not set; skipping webhook signature verification')
			return next()
		}
		res.status(500).json({ success: false, error: 'Server is not configured for webhook verification' })
		return
	}

	const provided = extractSignature(req)
	if (!provided) {
		res.status(401).json({ success: false, error: 'Missing signature header' })
		return
	}

	const providedNormalized = normalizeSignature(provided.trim())

	// Ensure we have the raw payload bytes
	const raw: Buffer = Buffer.isBuffer(req.body)
		? (req.body as Buffer)
		: Buffer.from(typeof req.body === 'string' ? (req.body as string) : JSON.stringify(req.body || {}), 'utf8')

	// Compute both hex and base64 encodings to be tolerant
	const hex = crypto.createHmac('sha256', secret).update(raw).digest('hex')
	const b64 = crypto.createHmac('sha256', secret).update(raw).digest('base64')

	const ok = timingSafeEqualStr(providedNormalized, hex) || timingSafeEqualStr(providedNormalized, b64)
	if (!ok) {
		if (process.env.VAPI_WEBHOOK_ALLOW_UNVERIFIED === 'true') {
			console.warn('VAPI webhook signature verification failed; proceeding due to VAPI_WEBHOOK_ALLOW_UNVERIFIED=true')
		} else {
			res.status(401).json({ success: false, error: 'Invalid webhook signature' })
			return
		}
	}

	// Parse JSON after verification so downstream handlers receive an object
	try {
		if (Buffer.isBuffer(req.body)) {
			const text = (req.body as Buffer).toString('utf8')
			if (text && text.length > 0) {
				;(req as any).body = JSON.parse(text)
			}
		}
	} catch (e) {
		res.status(400).json({ success: false, error: 'Invalid JSON payload' })
		return
	}

	next()
} 