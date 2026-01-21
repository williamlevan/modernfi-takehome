'use client';

import { ClipLoader } from 'react-spinners';
import styles from '../styles/components/LoadingModal.module.scss';

interface LoadingModalProps {
    isLoading: boolean;
}

export default function LoadingModal({ isLoading }: LoadingModalProps) {
    if (!isLoading) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <ClipLoader color="#3b82f6" size={50} />
                <p className={styles.text}>Loading...</p>
            </div>
        </div>
    );
}