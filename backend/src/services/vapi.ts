export interface OutboundCallParams {
	toPhoneNumber: string;
	patientId: string;
	patientName?: string;
}

export interface OutboundCallResult {
	id?: string;
	status?: string;
	[key: string]: unknown;
}

export async function initiateOutboundCall(params: OutboundCallParams): Promise<OutboundCallResult> {
	const apiKey = process.env.VAPI_API_KEY;
	if (!apiKey) throw new Error('VAPI_API_KEY is not set');

	const assistantId = process.env.VAPI_ASSISTANT_ID;
	const webhookUrl = process.env.VAPI_WEBHOOK_URL;

	const endpoint = 'https://api.vapi.ai/v1/calls';
	const payload = {
		to: params.toPhoneNumber,
		metadata: { patientId: params.patientId, patientName: params.patientName },
		...(assistantId ? { assistantId } : {}),
		...(webhookUrl ? { webhookUrl } : {}),
	};

	const res = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
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