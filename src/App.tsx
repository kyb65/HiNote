import { useCallback, useEffect, useRef, useState } from "react";
import type { TextBoxObject, CanvasViewState } from "./types";
import { OriginCross } from "./components/OriginCross";
import { TextBox } from "./components/TextBox";
import "./App.css";

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;

function generateId(): string {
  return `tb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<CanvasViewState>({
    panX: 0,
    panY: 0,
    scale: 1,
  });
  const [textBoxes, setTextBoxes] = useState<TextBoxObject[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  /** 보이는 화면(visual viewport) 중심 기준으로 캔버스 좌표 계산. 문서가 가로 스크롤되더라도 clientX/Y는 보이는 영역 기준이므로, center도 보이는 영역 크기로 써야 함. */
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const { panX, panY, scale } = view;
      const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
      const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
      const x = (screenX - centerX - panX) / scale;
      const y = (screenY - centerY - panY) / scale;
      return { x, y };
    },
    [view.panX, view.panY, view.scale]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
      const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
      setView((prev) => {
        const newScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, prev.scale + delta)
        );
        const cx = (mouseX - centerX - prev.panX) / prev.scale;
        const cy = (mouseY - centerY - prev.panY) / prev.scale;
        const newPanX = mouseX - centerX - cx * newScale;
        const newPanY = mouseY - centerY - cy * newScale;
        return {
          ...prev,
          scale: newScale,
          panX: newPanX,
          panY: newPanY,
        };
      });
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const isMiddleButton = e.button === 1;
      if (spacePressed || isMiddleButton) {
        setIsPanning(true);
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: view.panX,
          panY: view.panY,
        };
        if (isMiddleButton && e.currentTarget instanceof HTMLElement) {
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        return;
      }
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-text-box]")) return;
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const newId = generateId();
      setTextBoxes((prev) => [
        ...prev,
        { id: newId, x, y, text: "" },
      ]);
      setLastAddedId(newId);
    },
    [spacePressed, view.panX, view.panY, screenToCanvas]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      setView((prev) => ({
        ...prev,
        panX: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        panY: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      }));
    },
    [isPanning]
  );

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") setSpacePressed(true);
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      setSpacePressed(false);
      setIsPanning(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const updateTextBox = useCallback((id: string, updates: Partial<TextBoxObject>) => {
    setTextBoxes((prev) =>
      prev.map((tb) => (tb.id === id ? { ...tb, ...updates } : tb))
    );
  }, []);

  const removeTextBox = useCallback((id: string) => {
    setTextBoxes((prev) => prev.filter((tb) => tb.id !== id));
    if (lastAddedId === id) setLastAddedId(null);
  }, [lastAddedId]);

  return (
    <div
      ref={viewportRef}
      className="viewport"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: spacePressed ? "grab" : isPanning ? "grabbing" : "crosshair" }}
    >
      <div
        className="canvas"
        style={{
          transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.scale})`,
        }}
      >
        <OriginCross />
        {textBoxes.map((tb) => (
          <TextBox
            key={tb.id}
            object={tb}
            scale={view.scale}
            autoFocus={tb.id === lastAddedId}
            onFocused={() => {
              setTimeout(() => setLastAddedId(null), 400);
            }}
            isNewlyCreated={tb.id === lastAddedId}
            onUpdate={(updates) => updateTextBox(tb.id, updates)}
            onDelete={() => removeTextBox(tb.id)}
          />
        ))}
      </div>
    </div>
  );
}
