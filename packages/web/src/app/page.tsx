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

  const loadYields = async () => {
    try {
      setYieldsLoading(true);
      const result: YieldsResponse = await fetchYields();
      if (result.success) {
        const transformedData = result.data.map(yieldData => ({
          ...yieldData,
          date: yieldData.date instanceof Date ? yieldData.date : new Date(yieldData.date),
        }));
        setYieldsData(transformedData);
      } else {
        setError('Failed to fetch yields data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch yields');
    } finally {
      setYieldsLoading(false);
    }
  };

  useEffect(() => {
    loadYields();
  }, []);

  // Show loading modal if either yields or orders are loading
  const isLoading = yieldsLoading || ordersLoading;

  return (
    <>
      <LoadingModal isLoading={isLoading} />
      <ErrorModal error={error} onRetry={loadYields} />
      <main className={styles.main}>
        <div className={styles.section}>
          {!error && (
            <YieldCurveChart yieldsData={yieldsData} width={900} height={500} />
          )}
        </div>
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