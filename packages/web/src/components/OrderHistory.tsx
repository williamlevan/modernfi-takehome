/**
 * Component displaying a paginated table of user's order history
 * Shows order details including amount, term, rate, and date
 */

'use client';

import { useOrders } from '../contexts/OrdersContext';
import styles from '../styles/components/OrderHistory.module.scss';

export default function OrderHistory() {
    const { orders, pagination, loading, error, setPage } = useOrders();

    /**
     * Formats amount in cents to USD currency string
     * @param cents - Amount in cents
     */
    const formatCurrency = (cents: number) => {
        return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    /**
     * Formats date to readable string (e.g., "Jan 15, 2026")
     * @param date - Date object to format
     */
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className={styles.orderHistory}>
            <h2 className={styles.title}>Order History</h2>

            {/* Loading state */}
            {loading && (
                <div className={styles.loading}>Loading orders...</div>
            )}

            {/* Error state */}
            {error && (
                <div className={styles.error}>{error}</div>
            )}

            {/* Orders table or empty state */}
            {!loading && !error && (
                <>
                    {orders.length === 0 ? (
                        <p className={styles.empty}>No orders found</p>
                    ) : (
                        <>
                            {/* Orders table */}
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Amount</th>
                                            <th>Term</th>
                                            <th>Rate</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id}>
                                                <td>{formatCurrency(order.amount_in_cents)}</td>
                                                <td>{order.term}</td>
                                                <td>{order.rate_at_submission.toFixed(2)}%</td>
                                                <td>{formatDate(order.curve_date)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination controls (only show if more than one page) */}
                            {pagination.totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        onClick={() => setPage(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className={styles.paginationButton}
                                    >
                                        Previous
                                    </button>
                                    <span className={styles.paginationInfo}>
                                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                                    </span>
                                    <button
                                        onClick={() => setPage(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className={styles.paginationButton}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}