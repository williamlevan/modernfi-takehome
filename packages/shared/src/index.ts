export interface Order {
  id: string;
  curve_date: Date;
  term: string;
  amount_in_cents: number;
  rate_at_submission: number;
  created_at: Date;
  series_id: string;
}

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

export interface SubmitOrderResponse {
  success: boolean;
  data: Order;
  error?: string;
}

export interface Yield {
  date: Date;
  value: number;
  term: string;
}

export interface FREDObservation {
  date: string;
  value: string;
  realtime_start: string;
  realtime_end: string;
}

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

export interface YieldData {
  date: Date;
  value: number;
  term: string;
  series_id: string;
}

export interface YieldsResponse {
  success: boolean;
  data: YieldData[];
  fetched_at: Date;
  errors?: YieldError[];
}

export interface YieldError {
  term: string;
  seriesId: string;
  error: string;
  statusCode?: number;
}