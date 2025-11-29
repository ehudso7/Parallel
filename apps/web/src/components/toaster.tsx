'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastIcon,
  useToast,
} from '@parallel/ui';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3">
              <ToastIcon variant={variant ?? undefined} />
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
    </>
  );
}
