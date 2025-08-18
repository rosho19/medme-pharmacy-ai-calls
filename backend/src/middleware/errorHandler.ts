import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export interface CustomError extends Error {
	statusCode?: number;
	status?: string;
}

export const errorHandler = (
	err: CustomError,
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Log error
	console.error(err);

	// Prisma known request errors
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === 'P2002') {
			return void res.status(400).json({ success: false, error: 'Duplicate value for a unique field' });
		}
		if (err.code === 'P2025') {
			return void res.status(404).json({ success: false, error: 'Resource not found' });
		}
	}

	// Prisma validation errors
	if (err instanceof Prisma.PrismaClientValidationError) {
		return void res.status(400).json({ success: false, error: 'Invalid data for the requested operation' });
	}

	// Generic fallback
	res.status((err as any).statusCode || 500).json({
		success: false,
		error: err.message || 'Server Error',
		...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
	});
};
