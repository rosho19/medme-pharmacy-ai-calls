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
	if (process.env.MOCK_VAPI === 'true') {
		return { id: `mock_${Date.now()}`, status: 'queued' }
	}

	const apiKey = process.env.VAPI_API_KEY;
	if (!apiKey) throw new Error('VAPI_API_KEY is not set');
	const assistantId = process.env.VAPI_ASSISTANT_ID;
	if (!assistantId) throw new Error('VAPI_ASSISTANT_ID is not set');
	const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
	if (!phoneNumberId) throw new Error('VAPI_PHONE_NUMBER_ID is not set');

	const baseUrl = (process.env.VAPI_BASE_URL || 'https://api.vapi.ai').replace(/\/$/, '')
	const endpoint = `${baseUrl}/call`;

	const payload = {
		phoneNumberId,
		assistantId,
		customer: { number: params.toPhoneNumber },
		metadata: { patientId: params.patientId, patientName: params.patientName },
	};

	const res = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Status code: ${res.status}\nBody: ${text}`);
	}

	return (await res.json()) as OutboundCallResult;
} 