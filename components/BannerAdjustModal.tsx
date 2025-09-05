import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BannerAdjustModalProps {
    isOpen: boolean;
    imageDataUrl: string | null;
    onClose: () => void;
    onConfirm: (base64: string) => void;
}

// LinkedIn banner aspect ratio 4:1 (recommended 1584x396)
const TARGET_WIDTH = 1584;
const TARGET_HEIGHT = 396;
const TARGET_RATIO = TARGET_WIDTH / TARGET_HEIGHT; // 4.0

const BannerAdjustModal: React.FC<BannerAdjustModalProps> = ({ isOpen, imageDataUrl, onClose, onConfirm }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [baseScale, setBaseScale] = useState(1);
    const [minZoom, setMinZoom] = useState(0.5);
    const [dragging, setDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStart = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Lock page scroll
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
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

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY;
        setZoom(v => Math.min(4, Math.max(minZoom, v + delta * 0.0015)));
    };

    const handleConfirm = () => {
        if (!imgRef.current || !containerRef.current) return;
        const img = imgRef.current;
        const container = containerRef.current;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;

        // crop area equals the visible container area that maintains 3:1 ratio
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const cropWidth = Math.min(containerWidth, containerHeight * TARGET_RATIO);
        const cropHeight = cropWidth / TARGET_RATIO;
        const cropCenterX = containerWidth / 2;
        const cropCenterY = containerHeight / 2;
        const cropLeft = cropCenterX - cropWidth / 2;
        const cropTop = cropCenterY - cropHeight / 2;

        const totalScale = baseScale * zoom;
        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;
        const imgDisplayWidth = imgNaturalWidth * totalScale;
        const imgDisplayHeight = imgNaturalHeight * totalScale;
        const imgCenterX = containerWidth / 2 + position.x;
        const imgCenterY = containerHeight / 2 + position.y;
        const imgLeft = imgCenterX - imgDisplayWidth / 2;
        const imgTop = imgCenterY - imgDisplayHeight / 2;

        const cropRelativeX = cropLeft - imgLeft;
        const cropRelativeY = cropTop - imgTop;
        const sourceX = cropRelativeX / totalScale;
        const sourceY = cropRelativeY / totalScale;
        const sourceW = cropWidth / totalScale;
        const sourceH = cropHeight / totalScale;

        const sx = Math.max(0, Math.min(imgNaturalWidth, sourceX));
        const sy = Math.max(0, Math.min(imgNaturalHeight, sourceY));
        const sw = Math.max(1, Math.min(imgNaturalWidth - sx, sourceW));
        const sh = Math.max(1, Math.min(imgNaturalHeight - sy, sourceH));

        ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        onConfirm(canvas.toDataURL('image/jpeg', 0.9));
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseUp={handleMouseUp}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[95vw] max-w-[1100px] p-4 sm:p-6 max-h-[92vh] overflow-auto">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div
                            ref={containerRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onWheel={handleWheel}
                            className="relative w-full overflow-hidden rounded-xl bg-slate-800 border border-slate-700"
                            style={{ cursor: dragging ? 'grabbing' : 'grab', aspectRatio: `${TARGET_RATIO} / 1` as any }}
                        >
                            <img
                                ref={imgRef}
                                src={imageDataUrl || ''}
                                alt="Adjust banner"
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
                                onLoad={() => {
                                    const c = containerRef.current; const i = imgRef.current; if (!c || !i) return;
                                    const rect = c.getBoundingClientRect();
                                    const cw = rect.width; const ch = rect.height;
                                    const iw = i.naturalWidth; const ih = i.naturalHeight;
                                    const imgAspect = iw / ih;
                                    const scaleW = cw / iw;
                                    const scaleH = ch / ih;
                                    const cover = Math.max(scaleW, scaleH);
                                    setBaseScale(cover);
                                    const epsilon = 0.02; // aspect tolerance
                                    if (Math.abs(imgAspect - TARGET_RATIO) < epsilon) {
                                        // Perfect (or near) 4:1 – snap exactly to fit
                                        setMinZoom(1);
                                        setZoom(1);
                                        setPosition({ x: 0, y: 0 });
                                        return;
                                    }
                                    const neededTotal = Math.max(scaleW, scaleH);
                                    const computedMin = Math.max(0.1, neededTotal / cover);
                                    setMinZoom(computedMin);
                                    setZoom(Math.max(1, computedMin));
                                    setPosition({ x: 0, y: 0 });
                                }}
                            />
                            {/* Outline of crop area */}
                            <div className="pointer-events-none absolute inset-0 border-2 border-emerald-400/60 rounded-xl"></div>
                        </div>
                        <div className="mt-4">
                            <input type="range" min={minZoom} max={4} step={0.01} value={zoom} onChange={(e)=>setZoom(Math.max(minZoom, parseFloat(e.target.value)))} className="w-full" />
                        </div>
                    </div>
                    <div className="w-full md:w-64 space-y-3">
                        <h3 className="text-white font-semibold text-lg">Adjust banner</h3>
                        <p className="text-slate-400 text-sm">Drag and zoom to fit a wide banner. Final size is 1584×396 (4:1).</p>
                        <div className="flex gap-2 pt-2">
                            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700">Cancel</button>
                            <button onClick={handleConfirm} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BannerAdjustModal;


