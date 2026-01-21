/**
 * React Context for displaying snackbar notifications across the application
 * Supports success and error messages with auto-dismiss for success messages
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from '../styles/components/Snackbar.module.scss';

export type SnackbarType = 'success' | 'error';

/**
 * Type definition for the Snackbar context value
 */
interface SnackbarContextType {
  showSnackbar: (message: string, type: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

/**
 * Hook to access the Snackbar context
 * Throws an error if used outside of SnackbarProvider
 */
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

/**
 * Provider component that manages snackbar state and renders snackbar notifications
 */
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
      {/* Render snackbar when state is set */}
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

/**
 * Snackbar component that displays notification messages
 * Auto-dismisses success messages after 3 seconds
 * Error messages persist until manually closed
 */
function Snackbar({ message, type, onClose }: SnackbarProps) {
  const isSuccess = type === 'success';

  // Auto-dismiss success messages after 3 seconds
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