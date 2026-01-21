/**
 * Main page component displaying yield curve chart, order submission, and order history
 * Manages yields data fetching and coordinates loading/error states
 */

'use client';

import { useState, useEffect } from 'react';
import YieldCurveChart from '@/components/YieldCurveChart';
import OrderHistory from '@/components/OrderHistory';
import OrderSubmission from '@/components/OrderSubmission';
import LoadingModal from '@/components/LoadingModal';
import ErrorModal from '@/components/ErrorModal';
import { fetchYields } from '@/server';
import { useOrders } from '@/contexts/OrdersContext';
import { YieldData, YieldsResponse } from '@modernfi-takehome/shared';
import styles from '../styles/page.module.scss';

export default function Home() {
  const [yieldsData, setYieldsData] = useState<YieldData[]>([]);
  const [yieldsLoading, setYieldsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: ordersLoading } = useOrders();

  /**
   * Fetches treasury yield data from the API
   * Transforms date fields to ensure proper Date object handling
   */
  const loadYields = async () => {
    try {
      setYieldsLoading(true);
      const result: YieldsResponse = await fetchYields();
      if (result.success) {
        // Ensure dates are Date objects (handle both Date and string formats)
        const transformedData = result.data.map(yieldData => ({
          ...yieldData,
          date: yieldData.date instanceof Date ? yieldData.date : new Date(yieldData.date),
        }));
        setYieldsData(transformedData);
        setError(null); // Clear any previous errors on success
      } else {
        setError('Failed to fetch yields data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch yields');
    } finally {
      setYieldsLoading(false);
    }
  };

  // Load yields data on component mount
  useEffect(() => {
    loadYields();
  }, []);

  // Show loading modal if either yields or orders are loading
  const isLoading = yieldsLoading || ordersLoading;

  return (
    <>
      {/* Full-screen modals for loading and error states */}
      <LoadingModal isLoading={isLoading} />
      <ErrorModal error={error} onRetry={loadYields} />
      
      <main className={styles.main}>
        {/* Yield curve chart section */}
        <div className={styles.section}>
          {!error && (
            <YieldCurveChart yieldsData={yieldsData} width={900} height={500} />
          )}
        </div>
        
        {/* Two-column layout for order submission and history */}
        <div className={styles.twoColumn}>
          <div className={styles.column}>
            <OrderSubmission yieldsData={yieldsData} />
          </div>
          <div className={styles.column}>
            <OrderHistory />
          </div>
        </div>
      </main>
    </>
  );
}