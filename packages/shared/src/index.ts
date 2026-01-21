/**
 * Shared TypeScript types and interfaces for the ModernFi application
 * Used by both frontend and backend packages
 */

/**
 * Represents a treasury order submitted by a user
 */
export interface Order {
  id: string;
  curve_date: Date; // Date of the yield curve used for this order
  term: string; // Treasury term (e.g., '1Y', '10Y', '30Y')
  amount_in_cents: number; // Order amount in cents (USD)
  rate_at_submission: number; // Treasury yield rate at time of submission (%)
  created_at: Date; // Timestamp when order was created
  series_id: string; // FRED API series ID for the treasury term
}

/**
 * Response format for GET /api/orders endpoint
 */
export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Response format for POST /api/orders endpoint
 */
export interface SubmitOrderResponse {
  success: boolean;
  data: Order;
  error?: string;
}

/**
 * Basic yield data structure (legacy/unused)
 */
export interface Yield {
  date: Date;
  value: number;
  term: string;
}

/**
 * Single observation from FRED API response
 */
export interface FREDObservation {
  date: string; // Date in YYYY-MM-DD format
  value: string; // Yield value (may be '.' for missing data)
  realtime_start: string;
  realtime_end: string;
}

/**
 * Complete response structure from FRED API
 */
export interface FREDResponse {
  observations: FREDObservation[];
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
}

/**
 * Parsed treasury yield data point
 */
export interface YieldData {
  date: Date;
  value: number; // Yield rate as a percentage
  term: string; // Treasury term (e.g., '1Y', '10Y', '30Y')
  series_id: string; // FRED API series ID
}

/**
 * Response format for GET /api/yields endpoint
 */
export interface YieldsResponse {
  success: boolean;
  data: YieldData[];
  fetched_at: Date;
  errors?: YieldError[]; // Partial errors if some terms failed to fetch
  fromCache?: boolean; // Indicates if data came from cache
}

/**
 * Error information for failed yield data fetches
 */
export interface YieldError {
  term: string;
  seriesId: string;
  error: string;
  statusCode?: number; // HTTP status code if available
}