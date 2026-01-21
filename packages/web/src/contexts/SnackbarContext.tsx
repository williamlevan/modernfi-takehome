'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from '../styles/components/Snackbar.module.scss';

export type SnackbarType = 'success' | 'error';

interface SnackbarContextType {
  showSnackbar: (message: string, type: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: SnackbarType;
  } | null>(null);

  const showSnackbar = (message: string, type: SnackbarType) => {
    setSnackbar({ message, type });
  };

  const hideSnackbar = () => {
    setSnackbar(null);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={hideSnackbar}
        />
      )}
    </SnackbarContext.Provider>
  );
}

interface SnackbarProps {
  message: string;
  type: SnackbarType;
  onClose: () => void;
}

function Snackbar({ message, type, onClose }: SnackbarProps) {
  const isSuccess = type === 'success';

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  // Use camelCase class names that match the SCSS
  const typeClass = type === 'success' ? styles.snackbarSuccess : styles.snackbarError;

  return (
    <div className={`${styles.snackbar} ${typeClass}`}>
      <span className={styles.snackbarMessage}>{message}</span>
      <button
        className={styles.snackbarClose}
        onClick={onClose}
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
}