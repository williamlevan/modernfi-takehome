'use client';

import { useRouter } from 'next/navigation';
import styles from '../styles/components/ErrorModal.module.scss';

interface ErrorModalProps {
    error: string | null;
    onRetry?: () => void;
}

export default function ErrorModal({ error, onRetry }: ErrorModalProps) {
    const router = useRouter();

    if (!error) return null;

    const handleRefresh = () => {
        router.refresh();
        if (onRetry) {
            onRetry();
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>⚠️</div>
                <h2 className={styles.title}>Error Loading Data</h2>
                <p className={styles.message}>
                    An error occurred while loading data. Please wait a minute and refresh the page.
                </p>
                <button onClick={handleRefresh} className={styles.refreshButton}>
                    Refresh Page
                </button>
            </div>
        </div>
    );
}