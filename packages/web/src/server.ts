/**
 * API client functions for communicating with the backend
 * All functions return typed responses matching the shared interfaces
 */

import { YieldsResponse, YieldData, OrdersResponse, SubmitOrderResponse } from '@modernfi-takehome/shared';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetches treasury yield data from the backend
 */
export const fetchYields = async (): Promise<YieldsResponse> => {
    const response = await fetch(`${API_BASE_URL}/yields`);
    const result: YieldsResponse = await response.json();
    return result;
}

/**
 * Fetches paginated list of orders from the backend
 * @param page - Page number (default: 1)
 * @param limit - Number of orders per page (default: 10)
 */
export const fetchOrders = async (page: number = 1, limit: number = 10): Promise<OrdersResponse> => {
    const response = await fetch(`${API_BASE_URL}/orders?page=${page}&limit=${limit}`);
    const result: OrdersResponse = await response.json();
    return result;
}

/**
 * Submits a new order to the backend
 * Generates a unique idempotency key to prevent duplicate submissions
 * @param selectedTerm - Treasury term (e.g., '1Y', '10Y')
 * @param amountInCents - Order amount in cents
 * @param rate - Yield rate at submission time
 * @param curveDate - Date of the yield curve data
 * @param seriesId - FRED API series ID for the term
 */
export const submitOrder = async (selectedTerm: string, amountInCents: number, rate: number, curveDate: Date, seriesId: string): Promise<SubmitOrderResponse> => {
    // Generate unique idempotency key (timestamp + random string)
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
            term: selectedTerm,
            amount_in_cents: amountInCents,
            rate_at_submission: rate,
            curve_date: curveDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            series_id: seriesId,
        }),
    });

    const result = await response.json();
    return result;
}