import type { Metadata } from 'next';
import '../styles/globals.scss';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { OrdersProvider } from '../contexts/OrdersContext';

export const metadata: Metadata = {
  title: 'ModernFi',
  description: 'ModernFi Takehome Assessment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SnackbarProvider>
          <OrdersProvider>
            {children}
          </OrdersProvider>
        </SnackbarProvider>
      </body>
    </html>
  );
}