/**
 * React Context for managing orders state across the application
 * Provides orders data, pagination, loading states, and refresh functionality
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Order, OrdersResponse } from '@modernfi-takehome/shared';
import { fetchOrders } from '../server';

/**
 * Type definition for the Orders context value
 */
interface OrdersContextType {
    orders: Order[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    loading: boolean;
    error: string | null;
    refreshOrders: () => Promise<void>;
    setPage: (page: number) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

/**
 * Hook to access the Orders context
 * Throws an error if used outside of OrdersProvider
 */
export function useOrders() {
    const context = useContext(OrdersContext);
    if (!context) {
        throw new Error('useOrders must be used within OrdersProvider');
    }
    return context;
}

interface OrdersProviderProps {
    children: ReactNode;
}

/**
 * Provider component that manages orders state and provides it to child components
 */
export function OrdersProvider({ children }: OrdersProviderProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches orders from the API and transforms date fields
     * Ensures curve_date is stored as date-only (no time component)
     */
    const loadOrders = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            const result: OrdersResponse = await fetchOrders(page, pagination.limit);

            if (result.success) {
                // Transform orders to ensure proper date parsing
                const transformedOrders = result.data.map(order => {
                    // Parse curve_date to date-only (no time)
                    let curveDate: Date;
                    if (order.curve_date instanceof Date) {
                        // If already a Date, extract year, month, day and create new Date at local midnight
                        const year = order.curve_date.getFullYear();
                        const month = order.curve_date.getMonth();
                        const day = order.curve_date.getDate();
                        curveDate = new Date(year, month, day);
                    } else {
                        // If string, parse as YYYY-MM-DD format and create Date at local midnight
                        const dateStr = typeof order.curve_date === 'string'
                            ? order.curve_date
                            : (order.curve_date as any).toString();
                        const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
                        curveDate = new Date(year, month - 1, day); // month is 0-indexed
                    }

                    return {
                        ...order,
                        curve_date: curveDate,
                        created_at: order.created_at instanceof Date ? order.created_at : new Date(order.created_at),
                    };
                });

                setOrders(transformedOrders);
                // Update pagination state (map total_pages from API response)
                setPagination({
                    page: result.pagination.page,
                    limit: result.pagination.limit,
                    total: result.pagination.total,
                    totalPages: result.pagination.total_pages
                });
            } else {
                setError('Failed to fetch orders');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, [pagination.limit]);

    /**
     * Refreshes orders for the current page
     */
    const refreshOrders = useCallback(async () => {
        await loadOrders(pagination.page);
    }, [loadOrders, pagination.page]);

    /**
     * Changes the current page and loads orders for that page
     */
    const setPage = useCallback((page: number) => {
        loadOrders(page);
    }, [loadOrders]);

    // Load orders on initial mount
    useEffect(() => {
        loadOrders(1);
    }, []);

    return (
        <OrdersContext.Provider value={{
            orders,
            pagination,
            loading,
            error,
            refreshOrders,
            setPage,
        }}>
            {children}
        </OrdersContext.Provider>
    );
}