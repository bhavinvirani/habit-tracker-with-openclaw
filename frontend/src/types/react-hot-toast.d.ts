declare module 'react-hot-toast' {
  import { ReactNode } from 'react';

  export interface IconTheme {
    primary: string;
    secondary: string;
  }

  export interface ToastOptions {
    id?: string;
    icon?: ReactNode;
    duration?: number;
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right';
    style?: React.CSSProperties;
    className?: string;
    iconTheme?: IconTheme;
  }

  export interface DefaultToastOptions extends ToastOptions {
    success?: ToastOptions;
    error?: ToastOptions;
    loading?: ToastOptions;
    blank?: ToastOptions;
    custom?: ToastOptions;
  }

  export interface Toast {
    id: string;
    type: 'success' | 'error' | 'loading' | 'blank' | 'custom';
    message: ReactNode;
    visible: boolean;
  }

  interface ToastFunction {
    (message: ReactNode, options?: ToastOptions): string;
    success: (message: ReactNode, options?: ToastOptions) => string;
    error: (message: ReactNode, options?: ToastOptions) => string;
    loading: (message: ReactNode, options?: ToastOptions) => string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
    promise: <T>(
      promise: Promise<T>,
      msgs: {
        loading: ReactNode;
        success: ReactNode | ((data: T) => ReactNode);
        error: ReactNode | ((err: unknown) => ReactNode);
      },
      options?: ToastOptions
    ) => Promise<T>;
  }

  const toast: ToastFunction;
  export default toast;

  export interface ToasterProps {
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right';
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
    toastOptions?: DefaultToastOptions;
  }

  export const Toaster: React.FC<ToasterProps>;
}
