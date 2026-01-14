import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

type ModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const titleId = React.useId();

  if (!isOpen) return null;

  const modalContent = (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] bg-white flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 ">
            <h2 id={titleId} className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              aria-label="Close modal"
            >
              <span className="text-2xl">&times;</span>
            </Button>
          </div>

          <div className="px-6 py-2 overflow-y-auto flex-1">{children}</div>

          {footer && (
            <div
              data-testid="modal-footer"
              className="flex items-center justify-end gap-2 p-6 "
            >
              {footer}
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-0 bg-black/70 -z-10" />
    </div>
  );

  return createPortal(modalContent, document.body);
};
