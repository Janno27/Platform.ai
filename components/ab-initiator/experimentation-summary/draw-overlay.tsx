"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, Square, BoxSelect, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface DrawOverlayProps {
  variations: Array<{
    id: string;
    desktopImage?: string;
    mobileImage?: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  viewMode: 'desktop' | 'mobile' | 'draw';
  onSave: (id: string, newImageData: string) => void;
}

type DrawTool = 'border' | 'overlay' | 'select' | null;

interface Shape {
  id: string;
  type: 'border' | 'overlay';
  path: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingState {
  [imageId: string]: {
    [viewMode: string]: Shape[];
  }
}

const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  green: '#22C55E',
  red: '#EF4444',
  orange: '#F97316',
  blue: '#3B82F6',
  purple: '#8B5CF6'
};

export function DrawOverlay({ variations, isOpen, onClose, viewMode, onSave }: DrawOverlayProps) {
  const { theme } = useTheme();
  const [selectedTool, setSelectedTool] = useState<DrawTool>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [drawings, setDrawings] = useState<DrawingState>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>("");
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(
    theme === 'dark' ? COLORS.white : COLORS.black
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingStarted = useRef(false);
  const [slideDirection, setSlideDirection] = useState(0);

  const availableImages = variations.filter(v => v[viewMode === 'mobile' ? 'mobileImage' : 'desktopImage']);
  const currentImage = availableImages[currentImageIndex];

  const createPerfectRectangle = (startPoint: Point, endPoint: Point) => {
    return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y} L ${startPoint.x} ${endPoint.y} Z`;
  };

  const [startPoint, setStartPoint] = useState<Point | null>(null);

  const startDrawing = (e: React.MouseEvent) => {
    if (!selectedTool || selectedTool === 'select' || isDrawingStarted.current) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    e.stopPropagation();
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    isDrawingStarted.current = true;
    setIsDrawing(true);
    const point = getMousePosition(e);
    setStartPoint(point);
    setCurrentPath("");
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !selectedTool || selectedTool === 'select' || !startPoint || !isDrawingStarted.current) return;
    
    e.stopPropagation();
    
    const currentPoint = getMousePosition(e);
    const path = createPerfectRectangle(startPoint, currentPoint);
    setCurrentPath(path);
  };

  const endDrawing = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!isDrawing || !selectedTool || selectedTool === 'select' || !currentImage || !currentPath || !isDrawingStarted.current) {
      isDrawingStarted.current = false;
      setIsDrawing(false);
      return;
    }
    
    isDrawingStarted.current = false;
    setIsDrawing(false);
    setDrawings(prev => ({
      ...prev,
      [currentImage.id]: {
        ...prev[currentImage.id] || {},
        [viewMode]: [
          ...(prev[currentImage.id]?.[viewMode] || []),
          { 
            id: Date.now().toString(),
            type: selectedTool, 
            path: currentPath,
            color: selectedColor,
            x: 0,
            y: 0,
            width: 0,
            height: 0
          }
        ]
      }
    }));
    setCurrentPath("");
    setStartPoint(null);
  };

  const getMousePosition = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handleSave = () => {
    if (!currentImage || !drawings[currentImage.id]?.[viewMode]) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      if (viewMode === 'mobile') {
        canvas.width = 280;
        canvas.height = (280 * img.height) / img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      drawings[currentImage.id][viewMode]?.forEach(shape => {
        const path = new Path2D(shape.path);
        
        const scaleX = canvas.width / imageDimensions.width;
        const scaleY = canvas.height / imageDimensions.height;
        ctx.save();
        ctx.scale(scaleX, scaleY);

        if (shape.type === 'border') {
          ctx.strokeStyle = shape.color;
          ctx.stroke(path);
        } else {
          ctx.fillStyle = `${shape.color}4D`;
          ctx.fill(path);
        }
        ctx.restore();
      });

      const newImageData = canvas.toDataURL('image/png');
      
      onSave(currentImage.id, newImageData);
      
      onClose();
    };
    
    img.src = viewMode === 'mobile' ? currentImage.mobileImage! : currentImage.desktopImage!;
  };

  const IMAGE_DIMENSIONS = {
    width: 800,
    height: 500
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0
    })
  };

  const calculateImageDimensions = (image: HTMLImageElement) => {
    const maxWidth = 800;
    const maxHeight = 500;
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
    return {
      width: image.width * ratio,
      height: image.height * ratio
    };
  };

  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    if (currentImage) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions(calculateImageDimensions(img));
      };
      img.src = viewMode === 'mobile' ? currentImage.mobileImage! : currentImage.desktopImage!;
    }
  }, [currentImage, viewMode]);

  // Style du curseur selon l'outil
  const getCursorStyle = (tool: DrawTool) => {
    switch (tool) {
      case 'border':
        return 'cursor-[url(/cursors/pen.svg),crosshair]';
      case 'overlay':
        return 'cursor-[url(/cursors/brush.svg),crosshair]';
      default:
        return 'cursor-default';
    }
  };

  // Gestionnaire de touche pour la suppression
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedShape) {
        deleteSelectedShape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape]);

  const deleteSelectedShape = () => {
    if (!selectedShape || !currentImage) return;
    setDrawings(prev => ({
      ...prev,
      [currentImage.id]: {
        ...prev[currentImage.id],
        [viewMode]: prev[currentImage.id]?.[viewMode].filter(shape => shape.id !== selectedShape.id)
      }
    }));
    setSelectedShape(null);
  };

  const renderShape = (shape: Shape, index: number) => {
    const isSelected = selectedShape?.id === shape.id;
    
    return (
      <g key={shape.id}>
        <path
          d={shape.path}
          stroke={shape.type === 'border' ? shape.color : 'none'}
          strokeDasharray={shape.type === 'border' ? '5,5' : 'none'}
          fill={shape.type === 'overlay' ? `${shape.color}4D` : 'none'}
          strokeWidth="2"
          onClick={() => selectedTool === 'select' && setSelectedShape(shape)}
          className={cn("cursor-move", isSelected && "outline-2 outline-blue-500")}
        />
        
        {isSelected && (
          <>
            {/* Poignées de redimensionnement */}
            {['nw', 'ne', 'se', 'sw'].map(handle => (
              <circle
                key={handle}
                cx={getHandlePosition(shape, handle).x}
                cy={getHandlePosition(shape, handle).y}
                r={4}
                fill="white"
                stroke="blue"
                strokeWidth={2}
                className="cursor-pointer"
                onMouseDown={(e) => startResizing(e, handle)}
              />
            ))}
          </>
        )}
      </g>
    );
  };

  // Mettre à jour la couleur quand le thème change
  useEffect(() => {
    setSelectedColor(theme === 'dark' ? COLORS.white : COLORS.black);
  }, [theme]);

  // Désactiver le clic droit
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (isOpen) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [isOpen]);

  const handlePrevImage = () => {
    setSlideDirection(-1);
    setCurrentImageIndex(i => i - 1);
  };

  const handleNextImage = () => {
    setSlideDirection(1);
    setCurrentImageIndex(i => i + 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
        >
          {!availableImages.length ? (
            <div className="h-full flex items-center justify-center">
              <div className="bg-background rounded-lg p-6 shadow-lg max-w-md">
                <h3 className="text-lg font-medium mb-2">No images available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please upload images for your variations before using the draw tool.
                </p>
                <Button
                  onClick={onClose}
                  className="w-full"
                  variant="outline"
                >
                  Close and upload images
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative h-full flex flex-col">
              <div className="absolute top-4 w-full px-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 bg-background rounded-full p-2 shadow-lg">
                  {/* Outil Rectangle Bordure */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("rounded-full", selectedTool === 'border' && "bg-primary/10")}
                      onClick={() => {
                        setSelectedTool('border');
                        setShowColorPicker(prev => prev === 'border' ? null : 'border');
                      }}
                    >
                      <BoxSelect className="h-4 w-4" style={{ color: selectedColor }} />
                    </Button>
                    {showColorPicker === 'border' && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-2 bg-background rounded-xl shadow-lg flex flex-col gap-2 min-w-[32px] border border-border/40">
                        {Object.entries(COLORS).map(([name, color]) => (
                          <button
                            key={name}
                            className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Outil Rectangle Plein */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("rounded-full", selectedTool === 'overlay' && "bg-primary/10")}
                      onClick={() => {
                        setSelectedTool('overlay');
                        setShowColorPicker(prev => prev === 'overlay' ? null : 'overlay');
                      }}
                    >
                      <Square className="h-4 w-4" style={{ color: selectedColor }} />
                    </Button>
                    {showColorPicker === 'overlay' && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-2 bg-background rounded-xl shadow-lg flex flex-col gap-2 min-w-[32px] border border-border/40">
                        {Object.entries(COLORS).map(([name, color]) => (
                          <button
                            key={name}
                            className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setDrawings({})}>
                    Clear
                  </Button>
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div 
                ref={containerRef}
                className="flex-1 flex items-center justify-center"
                onMouseDown={selectedTool && selectedTool !== 'select' ? startDrawing : undefined}
                onMouseMove={selectedTool && selectedTool !== 'select' ? draw : undefined}
                onMouseUp={selectedTool && selectedTool !== 'select' ? endDrawing : undefined}
                onMouseLeave={selectedTool && selectedTool !== 'select' ? endDrawing : undefined}
              >
                <div className="relative w-full flex items-center justify-center">
                  {/* Container pour l'image et les flèches avec une largeur fixe plus grande */}
                  <div 
                    className="relative flex items-center"
                    style={{ width: imageDimensions.width + 160 }}
                  >
                    {/* Navigation gauche - Toujours visible */}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={currentImageIndex === 0}
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background shadow-lg flex-shrink-0 z-10",
                        currentImageIndex === 0 && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    {/* Container de l'image centré */}
                    <div className="relative mx-auto" style={{ width: imageDimensions.width }}>
                      <AnimatePresence mode="wait" custom={slideDirection}>
                        {currentImage && (
                          <motion.div
                            key={currentImage.id}
                            custom={slideDirection}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                              x: { type: "spring", stiffness: 300, damping: 30 },
                              opacity: { duration: 0.2 }
                            }}
                            className="relative"
                            style={{
                              width: imageDimensions.width,
                              height: imageDimensions.height
                            }}
                          >
                            <img
                              src={viewMode === 'mobile' ? currentImage.mobileImage : currentImage.desktopImage}
                              alt={`Variation ${currentImage.id}`}
                              className="w-full h-full object-contain pointer-events-none select-none"
                            />
                            <svg
                              ref={svgRef}
                              className={cn(
                                "absolute inset-0",
                                getCursorStyle(selectedTool)
                              )}
                              width={imageDimensions.width}
                              height={imageDimensions.height}
                              viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                              style={{ pointerEvents: 'none' }}
                            >
                              {drawings[currentImage.id]?.[viewMode]?.map((drawing, index) => (
                                renderShape(drawing, index)
                              ))}
                              {isDrawing && currentPath && (
                                <path
                                  d={currentPath}
                                  stroke={selectedTool === 'border' ? selectedColor : 'none'}
                                  strokeDasharray={selectedTool === 'border' ? '5,5' : 'none'}
                                  fill={selectedTool === 'overlay' ? `${selectedColor}4D` : 'none'}
                                  strokeWidth="2"
                                />
                              )}
                            </svg>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Navigation droite - Toujours visible */}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={currentImageIndex >= availableImages.length - 1}
                      className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background shadow-lg flex-shrink-0 z-10",
                        currentImageIndex >= availableImages.length - 1 && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 