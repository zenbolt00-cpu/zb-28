import { NextResponse } from 'next/server';
import { handleApiError } from './errors';

type RouteHandler = (req: Request, context: any) => Promise<NextResponse> | NextResponse;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req: Request, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
