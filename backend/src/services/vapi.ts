export interface OutboundCallParams {
	toPhoneNumber: string;
	patientId: string;
	patientName?: string;
}

export interface OutboundCallResult {
	id?: string;
	callId?: string;
	conversationId?: string;
	status?: string;
	[key: string]: unknown;
}

export async function initiateOutboundCall(params: OutboundCallParams): Promise<OutboundCallResult> {
	const apiKey = process.env.VAPI_API_KEY;
	if (!apiKey) throw new Error('VAPI_API_KEY is not set');

	const assistantId = process.env.VAPI_ASSISTANT_ID;
	const webhookUrl = process.env.VAPI_WEBHOOK_URL;

	// Make endpoint configurable to adapt to provider API differences
	const baseUrl = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
	const callsPath = process.env.VAPI_CALLS_PATH || '/v1/call';
	const endpoint = `${baseUrl.replace(/\/$/, '')}${callsPath.startsWith('/') ? callsPath : `/${callsPath}`}`;

	// Payload with multiple common fields to maximize compatibility
	const payload: Record<string, unknown> = {
		// Some providers expect phoneNumber, others expect to
		phoneNumber: params.toPhoneNumber,
		to: params.toPhoneNumber,
		metadata: { patientId: params.patientId, patientName: params.patientName },
		...(assistantId ? { assistantId } : {}),
		...(webhookUrl ? { webhookUrl } : {}),
	};

	const res = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Vapi call failed: ${res.status} ${text}`);
	}

	return (await res.json()) as OutboundCallResult;
} 