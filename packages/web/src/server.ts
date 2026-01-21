import { YieldsResponse, YieldData, OrdersResponse, SubmitOrderResponse } from '@modernfi-takehome/shared';

const API_BASE_URL = 'http://localhost:3001/api';

export const fetchYields = async (): Promise<YieldsResponse> => {
    const response = await fetch(`${API_BASE_URL}/yields`);
    const result: YieldsResponse = await response.json();
    return result;
}

export const fetchOrders = async (page: number = 1, limit: number = 10): Promise<OrdersResponse> => {
    const response = await fetch(`${API_BASE_URL}/orders?page=${page}&limit=${limit}`);
    const result: OrdersResponse = await response.json();
    return result;
}

export const submitOrder = async (selectedTerm: string, amountInCents: number, rate: number, curveDate: Date, seriesId: string): Promise<SubmitOrderResponse> => {
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
            curve_date: curveDate.toISOString().split('T')[0],
            series_id: seriesId,
        }),
    });

    const result = await response.json();
    return result;
}