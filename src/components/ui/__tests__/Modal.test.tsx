import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Content
      </Modal>,
    );
    expect(screen.queryByText(/test modal/i)).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Content
      </Modal>,
    );
    expect(screen.getByText(/test modal/i)).toBeInTheDocument();
    expect(screen.getByText(/content/i)).toBeInTheDocument();
  });

  it('renders title correctly', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Modal">
        Content
      </Modal>,
    );
    expect(screen.getByText(/my modal/i)).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Modal">
        <div>Modal Content</div>
      </Modal>,
    );
    expect(screen.getByText(/modal content/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Modal">
        Content
      </Modal>,
    );

    const closeButton = screen.getByLabelText(/close modal/i);
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Modal">
        Content
      </Modal>,
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the dialog', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Modal">
        <div>Content</div>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Modal"
        footer={<button>Save</button>}
      >
        Content
      </Modal>,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('does not render footer when not provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Modal">
        Content
      </Modal>,
    );
    expect(screen.queryByTestId('modal-footer')).not.toBeInTheDocument();
  });

  it('locks body scroll when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Modal">
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Modal">
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Modal">
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('restores body scroll on unmount', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}} title="Modal">
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('has correct accessibility attributes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Content
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');

    const title = screen.getByText(/test modal/i);
    expect(title).toHaveAttribute('id');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
  });
});
