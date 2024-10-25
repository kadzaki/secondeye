import {
    inkColorAtom,
    canvasRefAtom,
    overlayCanvasRefAtom,
    responseAtom,
    drawTypeAtom
  } from "../atoms";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from '../utils';
import { useDrawImageToCanvas, useSaveCanvasToLocalStorage } from "../hooks";
import { canvasHeight, canvasWidth } from "../consts";
import { BoundingBoxOverlay } from "./BoundingBoxOverlay";

export function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const w = canvasWidth;
    const h = canvasHeight;
    // store points and line color
    const pointsRef = useRef<
        { line: [number, number, number][]; color: string }[]
    >([]);
    const timeoutRef = useRef(-1);
    const [inkColor, setInkColor] = useAtom(inkColorAtom);
    const [drawType, setDrawType] = useAtom(drawTypeAtom);
    const setResponse = useSetAtom(responseAtom);
    const [canvasRefA] = useAtom(canvasRefAtom);
    const [overlayCanvasRefA] = useAtom(overlayCanvasRefAtom);
    const saveCanvasToLocalStorage = useSaveCanvasToLocalStorage();
    const drawImageToCanvas = useDrawImageToCanvas();
    let start = {}
    let isDown = false;

    function drawPoints() {
        if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")!;
        for (const points of pointsRef.current!) {
            ctx.fillStyle = points.color;
            const outlinePoints: [number, number, number][] = getStroke(
            points.line,
            {
                size: 3,
                simulatePressure: false,
            },
            ) as [number, number, number][];
            const pathData = getSvgPathFromStroke(outlinePoints);
            const path = new Path2D(pathData);
            ctx.fill(path);
        }
        }
    }

    function resetTimeout() {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
        saveCanvasToLocalStorage();
        }, 1000);
    }

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        if (drawType == 'rec') {
            start = getMousePos(e);
            isDown = true;
        } else {
            e.currentTarget.setPointerCapture(e.pointerId);
            e.preventDefault();
            const bounds = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - bounds.left;
            const y = e.clientY - bounds.top;
            pointsRef.current.push({ line: [[x, y, 1]], color: inkColor });
            drawPoints();
            resetTimeout();
        }
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        if (drawType == 'rec') {
            if (!isDown) {
                return;
            }

            let { x, y } = getMousePos(e);

            // calculate the rectangle width/height based
            // on starting vs current mouse position
            var width = x - start.x;
            var height = y - start.y;

            if (overlayCanvasRef.current) {
                const ctx = overlayCanvasRef.current.getContext("2d")!;
                ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                ctx.strokeStyle = inkColor;
                ctx.lineWidth = 3;
                ctx.strokeRect(start.x, start.y, width, height);
            }
        } else {
            if (e.buttons !== 1) return;
            e.preventDefault();
            const bounds = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - bounds.left;
            const y = e.clientY - bounds.top;
            const currentPoints = pointsRef.current[pointsRef.current.length - 1].line;
            currentPoints.push([x, y, 1]);
            drawPoints();
            resetTimeout();
        }
    }

    function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
        if (drawType == 'pen') {
            return;
        }

        let { x, y } = getMousePos(e);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d")!;
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(start.x, start.y, x - start.x, y - start.y);
        }

        isDown = false;
    }

    function getMousePos(e: React.PointerEvent<HTMLCanvasElement>) {
        const bounds = canvasRef.current!.getBoundingClientRect();

        return {
            x: (e.clientX - bounds.left),
            y: (e.clientY - bounds.top)
        }
    }

    useEffect(() => {
        function startRect(e: React.PointerEvent<HTMLCanvasElement>) {
            start = getMousePos(e);
            isDown = true;
        }

        function endRect(e: React.PointerEvent<HTMLCanvasElement>) {
            let { x, y } = getMousePos(e);
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d")!;
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 3;
                ctx.strokeRect(start.x, start.y, x - start.x, y - start.y);
            }

            isDown = false;
        } 

        function handleMouseMove(e: React.PointerEvent<HTMLCanvasElement>) {
            if (!isDown) {
                return;
            }

            let { x, y } = getMousePos(e);

            // calculate the rectangle width/height based
            // on starting vs current mouse position
            var width = x - start.x;
            var height = y - start.y;

            if (overlayCanvasRef.current) {
                const ctx = overlayCanvasRef.current.getContext("2d")!;
                ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                ctx.strokeRect(start.x, start.y, width, height);
            }
        }
    }, []);

    useEffect(() => {
        const prevCanvas = localStorage.getItem("canvas-1");
        const c = canvasRef.current!;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, c.width, c.height);
        // load from localStorage
        if (prevCanvas) {
            drawImageToCanvas(prevCanvas);
        } 
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
        if (document.visibilityState !== "hidden") {
            // Canvas seems to be clearing on tab change
            // So we need to redraw the image
            const prevCanvas = localStorage.getItem("canvas-1");
            const c = canvasRef.current!;
            const ctx = c.getContext("2d")!;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, c.width, c.height);
            // load from localStorage
            if (prevCanvas) {
            drawImageToCanvas(prevCanvas);
            }
        }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        canvasRefA.current = canvasRef.current;
        overlayCanvasRefA.current = overlayCanvasRef.current;
    }, [canvasRefA, overlayCanvasRefA]);

    return (
        <div className="canvasWrap">
            <canvas
                ref={canvasRef}
                width={w}
                height={h}
            />
            <canvas 
                className="overlayCanvas"
                ref={overlayCanvasRef} 
                width={w} 
                height={h} 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            />
            <BoundingBoxOverlay />
        </div>
    );
}
