"use client";

import React, { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export default function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Deep navy blue to simulate a real fountain pen
        ctx.strokeStyle = "#000080";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      onSignatureChange(null);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <div className="relative border-2 border-dashed border-gray-300 rounded-md bg-white w-full overflow-hidden flex items-center justify-center" style={{ touchAction: "none", height: "150px" }}>
        {/* Visual Baseline for alignment (does not get saved into the final PNG) */}
        <div className="absolute w-11/12 border-b border-gray-200 top-[75%] pointer-events-none" />
        <div className="absolute top-2 left-3 text-xs text-gray-300 pointer-events-none font-medium">X</div>
        
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          className="absolute inset-0 w-full h-full cursor-crosshair z-10 bg-transparent"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute top-2 right-2 text-xs text-gray-400 pointer-events-none z-0">Sign Here</div>
      </div>
      <button
        type="button"
        onClick={clearCanvas}
        className="text-xs text-gray-600 hover:text-red-600 font-medium transition-colors"
      >
        Clear Signature
      </button>
    </div>
  );
}
