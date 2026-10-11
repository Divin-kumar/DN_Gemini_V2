import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SwipeActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: 'edit' | 'unlink' | 'delete' | 'custom';
  onClick: () => void;
  ariaLabel?: string;
}

interface SwipeableRowProps {
  id: string;
  activeRowId: string | null;
  onRowOpen?: (id: string) => void;
  onRowClose?: () => void;
  actions: SwipeActionItem[];
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  id,
  activeRowId,
  onRowOpen,
  onRowClose,
  actions,
  children,
  className = '',
  contentClassName = '',
  disabled = false,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const actionWidth = 72; // Width per action button in px (comfortable mobile thumb target)
  const maxActionsWidth = actions.length * actionWidth;
  const isOpen = activeRowId === id;

  // Sync state if another row opened or active row changed
  useEffect(() => {
    if (activeRowId !== id && offsetX !== 0) {
      setOffsetX(0);
      currentOffsetRef.current = 0;
    }
  }, [activeRowId, id, offsetX]);

  const closeRow = useCallback(() => {
    setOffsetX(0);
    currentOffsetRef.current = 0;
    if (isOpen && onRowClose) {
      onRowClose();
    }
  }, [isOpen, onRowClose]);

  // Global listener: Close open swipe action when user taps/clicks elsewhere or presses Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentPointerDown = (e: PointerEvent | MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeRow();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRow();
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeRow]);

  // Gesture Start
  const handleStart = (clientX: number, clientY: number, pointerId?: number) => {
    if (disabled || actions.length === 0) return;
    startXRef.current = clientX;
    startYRef.current = clientY;
    isHorizontalSwipeRef.current = null;
    pointerIdRef.current = pointerId ?? null;
    setIsDragging(true);
  };

  // Gesture Move
  const handleMove = (clientX: number, clientY: number, e?: { cancelable?: boolean; preventDefault?: () => void }) => {
    if (disabled || !isDragging || actions.length === 0) return;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;

    // Detect gesture direction on first movement beyond threshold
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaY) > 6 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        isHorizontalSwipeRef.current = false; // Vertical scroll
        return;
      }
      if (Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isHorizontalSwipeRef.current = true; // Horizontal swipe
      }
    }

    if (isHorizontalSwipeRef.current) {
      if (e && e.cancelable && e.preventDefault) {
        e.preventDefault();
      }

      const base = isOpen ? -maxActionsWidth : 0;
      let newOffset = base + deltaX;

      // Restrict dragging: clamp between -maxActionsWidth (with rubber-band resistance) and 0
      if (newOffset > 0) {
        // Resistance when dragging right while closed
        newOffset = Math.min(10, newOffset * 0.2);
      } else if (newOffset < -maxActionsWidth) {
        // Rubber band resistance when dragging past full width
        const overdrag = Math.abs(newOffset - -maxActionsWidth);
        newOffset = -maxActionsWidth - Math.min(25, overdrag * 0.3);
      }

      setOffsetX(newOffset);
      currentOffsetRef.current = newOffset;
    }
  };

  // Gesture End
  const handleEnd = () => {
    if (disabled || !isDragging || actions.length === 0) {
      setIsDragging(false);
      pointerIdRef.current = null;
      return;
    }

    setIsDragging(false);
    pointerIdRef.current = null;

    if (isHorizontalSwipeRef.current) {
      const snapThreshold = -maxActionsWidth * 0.35;
      if (currentOffsetRef.current < snapThreshold) {
        // Snap open to reveal Edit / Delete
        setOffsetX(-maxActionsWidth);
        currentOffsetRef.current = -maxActionsWidth;
        if (onRowOpen) {
          onRowOpen(id);
        }
      } else {
        // Snap closed
        closeRow();
      }
    }
  };

  // Pointer Events (supports both mouse dragging and touch interactions)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary pointer (left mouse button or single touch)
    if (e.button !== 0) return;
    handleStart(e.clientX, e.clientY, e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || pointerIdRef.current !== e.pointerId) return;
    handleMove(e.clientX, e.clientY, e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current === e.pointerId) {
      handleEnd();
    }
  };

  const handlePointerCancel = () => {
    handleEnd();
  };

  // Touch Events (fallback for older iOS webkit implementations)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const getVariantStyles = (variant: SwipeActionItem['variant']) => {
    switch (variant) {
      case 'edit':
        return 'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 focus:ring-emerald-600';
      case 'unlink':
        return 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500';
      case 'delete':
        return 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500';
      default:
        return 'bg-stone-700 text-white hover:bg-stone-800 active:bg-stone-900 focus:ring-stone-600';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden touch-pan-y select-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Action Buttons Revealed Behind Sliding Content */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch z-0"
        style={{ width: `${maxActionsWidth}px` }}
        aria-hidden={!isOpen}
      >
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            onClick={e => {
              e.stopPropagation();
              closeRow();
              action.onClick();
            }}
            tabIndex={isOpen ? 0 : -1}
            aria-label={action.ariaLabel || action.label}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1.5 px-2 text-[11px] font-bold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-inset ${getVariantStyles(
              action.variant
            )}`}
          >
            <span className="w-4 h-4 shrink-0 flex items-center justify-center">
              {action.icon}
            </span>
            <span className="leading-none text-[11px] font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Foreground Sliding Content */}
      <div
        className={`relative z-10 bg-white dark:bg-stone-900 ${
          isDragging ? '' : 'transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]'
        } ${contentClassName}`}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
        onClick={() => {
          if (isOpen) {
            closeRow();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
};
