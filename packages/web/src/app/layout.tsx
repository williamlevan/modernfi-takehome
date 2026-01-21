/**
 * Root layout component for the Next.js application
 * Sets up global styles and context providers for the entire app
 */

import type { Metadata } from 'next';
import '../styles/globals.scss';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { OrdersProvider } from '../contexts/OrdersContext';

// Page metadata for SEO and browser tab
export const metadata: Metadata = {
  title: 'ModernFi',
  description: 'ModernFi Takehome Assessment',
};

/**
 * Root layout component that wraps all pages
 * Provides global context providers (Snackbar and Orders) to all child components
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Context providers wrap the entire application */}
        <SnackbarProvider>
          <OrdersProvider>
            {children}
          </OrdersProvider>
        </SnackbarProvider>
      </body>
    </html>
  );
}