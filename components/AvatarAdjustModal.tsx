import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface AvatarAdjustModalProps {
    isOpen: boolean;
    imageDataUrl: string | null;
    onClose: () => void;
    onConfirm: (base64: string) => void;
}

const AvatarAdjustModal: React.FC<AvatarAdjustModalProps> = ({ isOpen, imageDataUrl, onClose, onConfirm }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [baseScale, setBaseScale] = useState(1); // scale needed to cover the square container
    const [minZoom, setMinZoom] = useState(0.5);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });
    const pinchStartDistance = useRef<number | null>(null);
    const pinchStartScale = useRef<number>(1);

    useEffect(() => {
        if (!isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Lock background scroll while modal is open
    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen || !imageDataUrl) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        startPos.current = { ...position };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setPosition({ x: startPos.current.x + dx, y: startPos.current.y + dy });
    };

    const handleMouseUp = () => setDragging(false);
    const handleMouseLeave = () => setDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const next = Math.min(4, Math.max(minZoom, zoom + delta * 0.0015));
        setZoom(next);
    };

    const getDistance = (t1: Touch, t2: Touch) => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setDragging(true);
            dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            startPos.current = { ...position };
        } else if (e.touches.length === 2) {
            pinchStartDistance.current = getDistance(e.touches[0], e.touches[1]);
            pinchStartScale.current = zoom;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1 && dragging) {
            const dx = e.touches[0].clientX - dragStart.current.x;
            const dy = e.touches[0].clientY - dragStart.current.y;
            setPosition({ x: startPos.current.x + dx, y: startPos.current.y + dy });
        } else if (e.touches.length === 2 && pinchStartDistance.current) {
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const ratio = currentDistance / pinchStartDistance.current;
            const next = Math.min(4, Math.max(minZoom, pinchStartScale.current * ratio));
            setZoom(next);
        }
    };

    const handleTouchEnd = () => {
        setDragging(false);
        pinchStartDistance.current = null;
    };

    const handleConfirm = () => {
        if (!imgRef.current || !containerRef.current) return;
        const img = imgRef.current;
        const container = containerRef.current;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        // Crop to the full preview square grid area and export square avatar
        const containerSize = Math.min(container.clientWidth, container.clientHeight);
        const cropSize = containerSize; // full grid (entire preview square)
        const outputSize = 300; // consistent avatar pixels
        canvas.width = outputSize;
        canvas.height = outputSize;

        const cropCenterX = container.clientWidth / 2;
        const cropCenterY = container.clientHeight / 2;
        const cropHalf = cropSize / 2;

        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;
        const totalScale = baseScale * zoom;
        const imgDisplayWidth = imgNaturalWidth * totalScale;
        const imgDisplayHeight = imgNaturalHeight * totalScale;

        const imgCenterX = container.clientWidth / 2 + position.x;
        const imgCenterY = container.clientHeight / 2 + position.y;
        const imgTopLeftX = imgCenterX - imgDisplayWidth / 2;
        const imgTopLeftY = imgCenterY - imgDisplayHeight / 2;

        const cropRelativeX = cropCenterX - imgTopLeftX;
        const cropRelativeY = cropCenterY - imgTopLeftY;

        const sourceX = (cropRelativeX - cropHalf) / totalScale;
        const sourceY = (cropRelativeY - cropHalf) / totalScale;
        const sourceSize = cropSize / totalScale;

        const clampedSourceX = Math.max(0, Math.min(imgNaturalWidth - sourceSize, sourceX));
        const clampedSourceY = Math.max(0, Math.min(imgNaturalHeight - sourceSize, sourceY));
        const clampedSourceSize = Math.min(sourceSize, imgNaturalWidth - clampedSourceX, imgNaturalHeight - clampedSourceY);

        ctx.clearRect(0, 0, outputSize, outputSize);
        ctx.drawImage(
            img,
            clampedSourceX, clampedSourceY, clampedSourceSize, clampedSourceSize,
            0, 0, outputSize, outputSize
        );

        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        onConfirm(base64);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseUp={handleMouseUp}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[95vw] max-w-[860px] p-4 sm:p-6 max-h-[92vh] overflow-auto">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div
                            ref={containerRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onWheel={handleWheel}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                            className="relative w-full aspect-square max-h-[75vh] overflow-hidden rounded-xl bg-slate-800 border border-slate-700"
                            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
                        >
                            <img
                                ref={imgRef}
                                src={imageDataUrl || ''}
                                alt="Adjust avatar"
                                className="select-none pointer-events-none"
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${baseScale * zoom})`,
                                    transformOrigin: 'center center',
                                    userSelect: 'none',
                                    touchAction: 'none'
                                }}
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                                onLoad={() => {
                                    // compute base scale so the image covers the square container initially
                                    const container = containerRef.current;
                                    const imgEl = imgRef.current;
                                    if (!container || !imgEl) return;
                                    const containerSize = Math.min(container.clientWidth, container.clientHeight);
                                    const scaleWidth = containerSize / imgEl.naturalWidth;
                                    const scaleHeight = containerSize / imgEl.naturalHeight;
                                    const coverScale = Math.max(scaleWidth, scaleHeight); // cover behavior
                                    setBaseScale(coverScale);
                                    // ensure minimum zoom covers the full preview square (container)
                                    const cropSize = containerSize;
                                    const neededTotal = cropSize / Math.min(imgEl.naturalWidth, imgEl.naturalHeight);
                                    const computedMinZoom = Math.max(0.1, neededTotal / coverScale);
                                    setMinZoom(computedMinZoom);
                                    setZoom(Math.max(zoom, computedMinZoom));
                                }}
                            />
                            {/* Fine grid overlay */}
                            <div
                                className="pointer-events-none absolute inset-0"
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(0deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1px, transparent 1px, transparent 40px)'
                                }}
                            ></div>
                            {/* Rule-of-thirds bold lines */}
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute top-1/3 left-0 right-0 h-[2px] bg-white/25"></div>
                                <div className="absolute top-2/3 left-0 right-0 h-[2px] bg-white/25"></div>
                                <div className="absolute left-1/3 top-0 bottom-0 w-[2px] bg-white/25"></div>
                                <div className="absolute left-2/3 top-0 bottom-0 w-[2px] bg-white/25"></div>
                                {/* Circular crop visualization: dim outside the circle and show circular ring */}
                                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                        <mask id="circle-cutout">
                                            <rect x="0" y="0" width="100" height="100" fill="white" />
                                            <circle cx="50" cy="50" r="50" fill="black" />
                                        </mask>
                                    </defs>
                                    <rect x="0" y="0" width="100" height="100" fill="black" opacity="0.45" mask="url(#circle-cutout)" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="rounded-full border-2 border-emerald-400/70 w-full h-full"></div>
                                </div>
                            </div>
                            {/* Remove square ring; circle above represents crop area */}
                        </div>
                        <div className="mt-4">
                            <input
                                type="range"
                                min={minZoom}
                                max={4}
                                step={0.01}
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-64 space-y-3">
                        <h3 className="text-white font-semibold text-lg">Adjust your photo</h3>
                        <p className="text-slate-400 text-sm">Zoom and drag to position your photo. Final avatar is 1:1.</p>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AvatarAdjustModal;


