import * as React from "react";

import { cn } from "@/lib/utils";

const HOVER_DELAY_MS = 400;
const HOLD_DELAY_MS = 450;
const MOVE_CANCEL_PX = 10;
const VIEWPORT_MARGIN_PX = 8;

const variantClasses = {
  outline: "border border-border bg-transparent hover:bg-secondary",
  ghost: "border border-transparent bg-transparent hover:bg-secondary",
};

/**
 * HoldHint — icon-only toolbar button whose description lives in a small
 * hint card instead of visible text. Hover (desktop, ~400ms) or long-press
 * (touch/pen, ~450ms) reveals the hint; a plain tap/click fires onClick.
 * A long-press that revealed the hint swallows the click that follows it.
 *
 * Self-contained: every handler lives on the button itself (no document /
 * window listeners), so it coexists with pointer-driven neighbours like
 * the workspace Resizer. Timers are cleared on unmount.
 */
const HoldHint = React.forwardRef(function HoldHint(
  {
    icon: Icon,
    label,
    description,
    onClick,
    active = false,
    disabled = false,
    variant = "outline",
    size = "h-7 w-7",
    className,
    ...rest
  },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const [shiftPx, setShiftPx] = React.useState(0);
  const cardRef = React.useRef(null);
  const hoverTimerRef = React.useRef(null);
  const holdTimerRef = React.useRef(null);
  const heldRef = React.useRef(false);
  const pointerStartRef = React.useRef(null);
  const hintId = React.useId();

  const clearHoverTimer = React.useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const clearHoldTimer = React.useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  // Clear any pending timers on unmount so nothing fires afterwards.
  React.useEffect(
    () => () => {
      clearHoverTimer();
      clearHoldTimer();
    },
    [clearHoverTimer, clearHoldTimer]
  );

  // Clamp the hint card inside the viewport once it renders.
  React.useLayoutEffect(() => {
    if (!open) {
      setShiftPx(0);
      return;
    }
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    let shift = 0;
    if (rect.left < VIEWPORT_MARGIN_PX) {
      shift = VIEWPORT_MARGIN_PX - rect.left;
    } else if (rect.right > window.innerWidth - VIEWPORT_MARGIN_PX) {
      shift = window.innerWidth - VIEWPORT_MARGIN_PX - rect.right;
    }
    if (shift !== 0) setShiftPx((prev) => prev + shift);
  }, [open]);

  const hide = React.useCallback(() => {
    clearHoverTimer();
    setOpen(false);
  }, [clearHoverTimer]);

  // ── Desktop: hover reveals after a short delay ──
  const handleMouseEnter = () => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => {
      hoverTimerRef.current = null;
      setOpen(true);
    }, HOVER_DELAY_MS);
  };

  const handleMouseLeave = () => hide();

  // ── Keyboard: focus reveals, blur hides, Escape hides ──
  const handleFocus = (event) => {
    let keyboardFocus = true;
    try {
      keyboardFocus = event.target.matches(":focus-visible");
    } catch {
      // Older engines without :focus-visible — show anyway.
    }
    if (keyboardFocus) setOpen(true);
  };

  const handleBlur = () => hide();

  const handleKeyDown = (event) => {
    if (event.key === "Escape") hide();
  };

  // ── Touch / pen: long-press reveals and swallows the click ──
  const handlePointerDown = (event) => {
    heldRef.current = false;
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      heldRef.current = true;
      setOpen(true);
    }, HOLD_DELAY_MS);
  };

  const handlePointerMove = (event) => {
    if (!holdTimerRef.current || !pointerStartRef.current) return;
    const dx = event.clientX - pointerStartRef.current.x;
    const dy = event.clientY - pointerStartRef.current.y;
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      // The finger is scrolling, not holding — let the gesture through.
      clearHoldTimer();
      pointerStartRef.current = null;
    }
  };

  const handlePointerUp = () => {
    clearHoldTimer();
    pointerStartRef.current = null;
    if (heldRef.current) setOpen(false);
  };

  const handlePointerCancel = () => {
    clearHoldTimer();
    pointerStartRef.current = null;
    heldRef.current = false;
    setOpen(false);
  };

  const handleContextMenu = (event) => {
    // A touch long-press fires contextmenu on some platforms; keep the
    // hint gesture from also opening the browser menu.
    if (holdTimerRef.current || heldRef.current) event.preventDefault();
  };

  const handleClick = (event) => {
    if (heldRef.current) {
      // This click is the tail end of a long-press that showed the hint.
      heldRef.current = false;
      event.preventDefault();
      return;
    }
    if (onClick) onClick(event);
  };

  return (
    <span className="relative inline-flex">
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-describedby={open && description ? hintId : undefined}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-[2px] transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          variantClasses[variant] || variantClasses.outline,
          size,
          active ? "bg-secondary text-foreground" : "text-foreground/70",
          className
        )}
        style={{ WebkitTouchCallout: "none" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        {...rest}
      >
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <span
          ref={cardRef}
          id={hintId}
          role="tooltip"
          className="printed-card hold-hint-card pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 block w-max max-w-[240px] px-2.5 py-1.5 text-left"
          style={{ transform: `translateX(calc(-50% + ${shiftPx}px))` }}
        >
          <span className="block font-mono text-[11px] font-medium leading-4 text-foreground">
            {label}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
});
HoldHint.displayName = "HoldHint";

export { HoldHint };
