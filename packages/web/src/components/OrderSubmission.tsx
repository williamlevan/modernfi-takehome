/**
 * Component for submitting new treasury orders
 * Allows users to select a term, enter an amount, and submit orders with current yield rates
 */

'use client';

import { useState } from 'react';
import { YieldData } from '@modernfi-takehome/shared';
import { useOrders } from '../contexts/OrdersContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import styles from '../styles/components/OrderSubmission.module.scss';
import { TERM_ORDER } from '../constants/constants';
import { submitOrder } from '../server';

interface OrderSubmissionProps {
    yieldsData: YieldData[];
}

export default function OrderSubmission({ yieldsData }: OrderSubmissionProps) {
    const [selectedTerm, setSelectedTerm] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { refreshOrders } = useOrders();

    // Filter available terms to only those with yield data
    const availableTerms = TERM_ORDER.filter(term =>
        yieldsData.some(yieldData => yieldData.term === term)
    );

    // Get yield data for selected term
    const selectedYield = yieldsData.find(y => y.term === selectedTerm);
    const rate = selectedYield?.value ?? 0;
    const curveDate = selectedYield?.date ?? new Date();
    const seriesId = selectedYield?.series_id ?? '';

    /**
     * Handles form submission and order creation
     * Validates input, converts amount to cents, and submits order
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!selectedTerm || !amount) {
            showSnackbar('Please select a term and enter an amount', 'error');
            return;
        }

        // Convert dollar amount to cents
        const amountInCents = Math.round(parseFloat(amount) * 100);

        // Validate amount is a valid positive number
        if (isNaN(amountInCents) || amountInCents <= 0) {
            showSnackbar('Please enter a valid amount', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitOrder(selectedTerm, amountInCents, rate, curveDate, seriesId);

            if (result.success) {
                showSnackbar('Order submitted successfully!', 'success');
                // Reset form after successful submission
                setSelectedTerm('');
                setAmount('');
                refreshOrders(); // Refresh order history to show new order
            } else {
                showSnackbar(result.error || 'Failed to submit order', 'error');
            }
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to submit order', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.orderSubmission}>
            <h2 className={styles.title}>Submit Order</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Term selection dropdown */}
                <div className={styles.formGroup}>
                    <label htmlFor="term" className={styles.label}>
                        Term
                    </label>
                    <select
                        id="term"
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        className={styles.select}
                        required
                    >
                        <option value="">Select a term</option>
                        {availableTerms.map(term => (
                            <option key={term} value={term}>
                                {term}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Amount input */}
                <div className={styles.formGroup}>
                    <label htmlFor="amount" className={styles.label}>
                        Amount ($)
                    </label>
                    <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={styles.input}
                        placeholder="Enter amount"
                        required
                    />
                </div>

                {/* Display rate and date info when term is selected */}
                {selectedTerm && (
                    <div className={styles.infoGroup}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Rate:</span>
                            <span className={styles.infoValue}>{rate.toFixed(2)}%</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Date:</span>
                            <span className={styles.infoValue}>
                                {curveDate.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                )}

                {/* Submit button (disabled during submission or when form is invalid) */}
                <button
                    type="submit"
                    disabled={isSubmitting || !selectedTerm || !amount}
                    className={styles.submitButton}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Order'}
                </button>
            </form>
        </div>
    );
}

