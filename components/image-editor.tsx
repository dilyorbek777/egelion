"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crop,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  CircleDot,
  Aperture,
  RotateCcw,
  Check,
  X,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Frame,
  Sparkles,
  Droplet,
  Focus,
  SlidersHorizontal,
  Loader2,
  Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AspectRatio = "free" | "1:1" | "4:5" | "16:9" | "9:16";

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  vignette: number;
  blur: number;
  sharpen: number;
  exposure: number;
  highlights: number;
  shadows: number;
}

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onSave: (editedFile: File) => void;
  title?: string;
  defaultAspectRatio?: AspectRatio;
  allowAspectRatioChange?: boolean;
}

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  vignette: 0,
  blur: 0,
  sharpen: 0,
  exposure: 100,
  highlights: 100,
  shadows: 100,
};

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageEditor({
  isOpen,
  onClose,
  imageFile,
  onSave,
  title = "Edit Image",
  defaultAspectRatio = "free",
  allowAspectRatioChange = true,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<"crop" | "adjust">("crop");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultAspectRatio);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [saving, setSaving] = useState(false);

  const initializeCanvas = useCallback((img: HTMLImageElement) => {
    const maxWidth = 500;
    const maxHeight = 400;
    
    // Calculate scale factor that fits both dimensions
    const scaleFactor = Math.min(maxWidth / img.width, maxHeight / img.height);
    
    const displayWidth = img.width * scaleFactor;
    const displayHeight = img.height * scaleFactor;

    setCanvasSize({ width: displayWidth, height: displayHeight });
    setScale(scaleFactor);

    setCrop({
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    });

    setImageLoaded(true);
  }, []);

  useEffect(() => {
    if (!imageFile || !isOpen) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      initializeCanvas(img);
    };
    img.src = URL.createObjectURL(imageFile);

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [imageFile, isOpen, initializeCanvas]);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply adjustments
    const filters = [
      `brightness(${adjustments.brightness}%)`,
      `contrast(${adjustments.contrast}%)`,
      `saturate(${adjustments.saturation}%)`,
      `sepia(${Math.max(0, adjustments.warmth / 5)}%)`,
      `blur(${adjustments.blur}px)`,
    ].join(" ");

    ctx.filter = filters;

    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.filter = "none";

    if (adjustments.vignette > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 100})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Sharpen (Simple approximation)
    if (adjustments.sharpen > 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const factor = adjustments.sharpen / 100;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + (data[i] - 128) * factor);
        data[i + 1] = Math.min(255, data[i + 1] + (data[i + 1] - 128) * factor);
        data[i + 2] = Math.min(255, data[i + 2] + (data[i + 2] - 128) * factor);
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }, [crop, adjustments]);

  useEffect(() => {
    if (imageLoaded) {
      drawImage();
    }
  }, [drawImage, imageLoaded]);

  const handleAspectRatioChange = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    if (!imageRef.current) return;

    const img = imageRef.current;
    let newCrop: CropState;

    switch (ratio) {
      case "1:1":
        const size1 = Math.min(img.width, img.height);
        newCrop = { x: (img.width - size1) / 2, y: (img.height - size1) / 2, width: size1, height: size1 };
        break;
      case "4:5":
        const targetW45 = Math.min(img.width, img.height * 0.8);
        const targetH45 = targetW45 / 0.8;
        newCrop = { x: (img.width - targetW45) / 2, y: (img.height - targetH45) / 2, width: targetW45, height: targetH45 };
        break;
      case "16:9":
        const targetH169 = Math.min(img.height, img.width * (9 / 16));
        const targetW169 = targetH169 * (16 / 9);
        newCrop = { x: (img.width - targetW169) / 2, y: (img.height - targetH169) / 2, width: targetW169, height: targetH169 };
        break;
      case "9:16":
        const targetW916 = Math.min(img.width, img.height * (9 / 16));
        const targetH916 = targetW916 / (9 / 16);
        newCrop = { x: (img.width - targetW916) / 2, y: (img.height - targetH916) / 2, width: targetW916, height: targetH916 };
        break;
      default:
        newCrop = { x: 0, y: 0, width: img.width, height: img.height };
    }
    setCrop(newCrop);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== "crop") return;
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !imageRef.current || activeTab !== "crop") return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / scale;
    const currentY = (e.clientY - rect.top) / scale;

    const img = imageRef.current;
    let newWidth = Math.abs(currentX - dragStart.x);
    let newHeight = Math.abs(currentY - dragStart.y);

    if (aspectRatio !== "free") {
      const [w, h] = aspectRatio.split(":").map(Number);
      const ratio = w / h;
      if (newWidth / newHeight > ratio) newWidth = newHeight * ratio;
      else newHeight = newWidth / ratio;
    }

    const newX = Math.min(dragStart.x, currentX);
    const newY = Math.min(dragStart.y, currentY);

    setCrop({
      x: Math.max(0, Math.min(newX, img.width - newWidth)),
      y: Math.max(0, Math.min(newY, img.height - newHeight)),
      width: Math.min(newWidth, img.width),
      height: Math.min(newHeight, img.height),
    });
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    canvas.toBlob((blob) => {
      if (blob) {
        onSave(new File([blob], imageFile?.name || "edited.jpg", { type: "image/jpeg" }));
        setSaving(false);
      }
    }, "image/jpeg", 0.95);
  };

  const aspectRatioButtons = [
    { value: "free", icon: <Frame className="w-4 h-4" />, label: "Free" },
    { value: "1:1", icon: <Square className="w-4 h-4" />, label: "1:1" },
    { value: "4:5", icon: <RectangleVertical className="w-4 h-4" />, label: "4:5" },
    { value: "16:9", icon: <RectangleHorizontal className="w-4 h-4" />, label: "16:9" },
    { value: "9:16", icon: <RectangleVertical className="w-4 h-4 rotate-90" />, label: "9:16" },
  ];

  const adjustmentControls: { key: keyof ImageAdjustments; icon: any; label: string; min: number; max: number; step: number }[] = [
    { key: "brightness", icon: <Sun className="w-4 h-4" />, label: "Brightness", min: 0, max: 200, step: 1 },
    { key: "contrast", icon: <Contrast className="w-4 h-4" />, label: "Contrast", min: 0, max: 200, step: 1 },
    { key: "saturation", icon: <Droplets className="w-4 h-4" />, label: "Saturation", min: 0, max: 200, step: 1 },
    { key: "warmth", icon: <Thermometer className="w-4 h-4" />, label: "Warmth", min: -50, max: 50, step: 1 },
    { key: "exposure", icon: <Aperture className="w-4 h-4" />, label: "Exposure", min: 0, max: 200, step: 1 },
    { key: "vignette", icon: <Focus className="w-4 h-4" />, label: "Vignette", min: 0, max: 100, step: 1 },
    { key: "blur", icon: <Droplet className="w-4 h-4" />, label: "Blur", min: 0, max: 10, step: 0.5 },
    { key: "sharpen", icon: <Sparkles className="w-4 h-4" />, label: "Sharpen", min: 0, max: 100, step: 1 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-background border-0 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary"><Wand2 className="w-4 h-4 text-white" /></div>
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            </div>
            {/* <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8"><X className="w-4 h-4" /></Button> */}
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Editor Surface */}
            <div className="flex-1 bg-muted rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px] relative">
              <div 
                className={cn("relative", activeTab === "crop" && "cursor-crosshair")}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                style={{ width: canvasSize.width, height: canvasSize.height }}
              >
                {imageLoaded && (
                  <>
                    {/* Background Original (Ghost) */}
                    <img 
                      src={imageRef.current?.src} 
                      className={cn("absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity", activeTab === "crop" ? "opacity-30" : "opacity-0")} 
                      alt="original" 
                    />

                    {/* Active Preview Area */}
                    <div
                      className={cn(
                        "absolute overflow-hidden shadow-2xl transition-[left,top,width,height] duration-75 ease-out",
                        activeTab === "crop" ? "ring-2 ring-white z-10" : "inset-0 !w-full !h-full !left-0 !top-0"
                      )}
                      style={activeTab === "crop" ? {
                        left: crop.x * scale,
                        top: crop.y * scale,
                        width: crop.width * scale,
                        height: crop.height * scale,
                      } : {}}
                    >
                      <canvas ref={canvasRef} className="w-full h-full block" />
                      
                      {/* Crop Grid */}
                      {activeTab === "crop" && (
                         <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                            {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white/30" />)}
                         </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-72 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                <Button variant={activeTab === "adjust" ? "secondary" : "ghost"} onClick={() => setActiveTab("adjust")} className="h-9"><SlidersHorizontal className="w-4 h-4 mr-2" /> Adjust</Button>
                <Button variant={activeTab === "crop" ? "secondary" : "ghost"} onClick={() => setActiveTab("crop")} className="h-9"><Crop className="w-4 h-4 mr-2" /> Crop</Button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {activeTab === "crop" ? (
                    <motion.div key="crop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid grid-cols-5 gap-2">
                        {aspectRatioButtons.map((btn) => (
                          <button
                            key={btn.value}
                            onClick={() => handleAspectRatioChange(btn.value as AspectRatio)}
                            className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px]", aspectRatio === btn.value ? "bg-primary text-primary-foreground" : "bg-card")}
                          >
                            {btn.icon} {btn.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="adjust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      {adjustmentControls.map((ctrl) => (
                        <div key={ctrl.key} className="space-y-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1">{ctrl.icon} {ctrl.label}</span>
                            <span className="text-muted-foreground">{adjustments[ctrl.key]}</span>
                          </div>
                          <Slider
                            value={[adjustments[ctrl.key]]}
                            min={ctrl.min} max={ctrl.max} step={ctrl.step}
                            onValueChange={([v]) => setAdjustments(prev => ({ ...prev, [ctrl.key]: v }))}
                          />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button variant="outline" onClick={() => { setAdjustments(DEFAULT_ADJUSTMENTS); setAspectRatio("free"); if(imageRef.current) handleAspectRatioChange("free"); }} className="w-full h-10"><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 h-11" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Save Changes</>}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}