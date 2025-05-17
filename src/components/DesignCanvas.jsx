import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import { getDesignImage, getDesignWorksheet } from '../lib/awsService';
import { toast } from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import S3PDFViewer from './S3PDFViewer';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export default forwardRef(function DesignCanvas({ designNo, viewMode = 'design', backgroundColor = '#f9fafb' }, ref) {
  const canvasWrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const currentPageRef = useRef(1);
  const imageUrlRef = useRef(null);
  const imageObjectRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backgroundType, setBackgroundType] = useState('color');
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useImperativeHandle(ref, () => ({
    handleBackgroundImage,
    startWebcam,
    stopWebcam,
    backgroundType,
    nextPage: () => {
      if (pdfDocRef.current && currentPageRef.current < pdfDocRef.current.numPages) {
        currentPageRef.current++;
        renderPdfPage();
      }
    },
    previousPage: () => {
      if (pdfDocRef.current && currentPageRef.current > 1) {
        currentPageRef.current--;
        renderPdfPage();
      }
    },
    getCurrentPage: () => currentPageRef.current,
    getTotalPages: () => pdfDocRef.current?.numPages || 0
  }));

  const renderPdfPage = async () => {
    if (!pdfDocRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(currentPageRef.current);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      if (canvasWrapperRef.current) {
        // Clear previous content
        while (canvasWrapperRef.current.firstChild) {
          canvasWrapperRef.current.firstChild.remove();
        }
        canvasWrapperRef.current.appendChild(canvas);
      }
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      toast.error('Failed to render PDF page');
    }
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasWrapperRef.current || viewMode === 'worksheet') return;

    // Get wrapper dimensions
    const wrapper = canvasWrapperRef.current;
    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;

    // Create a new canvas element
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    
    // Clear previous canvas if it exists
    wrapper.innerHTML = '';
    wrapper.appendChild(canvas);

    // Initialize Fabric canvas with wrapper dimensions
    const fabricCanvas = new fabric.Canvas(canvas, {
      width: wrapperWidth,
      height: wrapperHeight,
      backgroundColor: backgroundColor,
      preserveObjectStacking: true,
      selection: false
    });

    fabricCanvasRef.current = fabricCanvas;

    // Add event listeners for object movement and scaling
    fabricCanvas.on('object:moving', (e) => {
      if (!e.target || !fabricCanvas) return;
      
      const obj = e.target;
      if (typeof obj.getScaledWidth !== 'function' || typeof obj.getScaledHeight !== 'function') {
        return;
      }

      try {
        const objWidth = obj.getScaledWidth();
        const objHeight = obj.getScaledHeight();
        
        const minX = 0;
        const maxX = fabricCanvas.width - objWidth;
        const minY = 0;
        const maxY = fabricCanvas.height - objHeight;

        obj.set({
          left: Math.min(Math.max(obj.left, minX), maxX),
          top: Math.min(Math.max(obj.top, minY), maxY)
        });
      } catch (error) {
        console.error('Error in object:moving handler:', error);
      }
    });

    fabricCanvas.on('object:scaling', (e) => {
      if (!e.target || !fabricCanvas) return;
      
      const obj = e.target;
      if (typeof obj.getScaledWidth !== 'function' || typeof obj.getScaledHeight !== 'function') {
        return;
      }

      try {
        const objWidth = obj.getScaledWidth();
        const objHeight = obj.getScaledHeight();
        
        if (objWidth + obj.left > fabricCanvas.width) {
          obj.scaleX = (fabricCanvas.width - obj.left) / obj.width;
        }
        if (objHeight + obj.top > fabricCanvas.height) {
          obj.scaleY = (fabricCanvas.height - obj.top) / obj.height;
        }

        const minSize = 50;
        if (objWidth < minSize) {
          obj.scaleX = minSize / obj.width;
        }
        if (objHeight < minSize) {
          obj.scaleY = minSize / obj.height;
        }

        fabricCanvas.renderAll();
      } catch (error) {
        console.error('Error in object:scaling handler:', error);
      }
    });

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
      }
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
      imageObjectRef.current = null;
    };
  }, [viewMode, backgroundColor]);

  // Handle background color changes
  useEffect(() => {
    if (fabricCanvasRef.current && backgroundType === 'color') {
      fabricCanvasRef.current.setBackgroundColor(backgroundColor, () => {
        fabricCanvasRef.current.renderAll();
      });
    }
  }, [backgroundColor, backgroundType]);

  // Handle background image
  const handleBackgroundImage = (file) => {
    if (!fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        const canvas = fabricCanvasRef.current;
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        const scale = Math.max(scaleX, scaleY);

        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: canvas.width / 2,
          top: canvas.height / 2,
          selectable: false
        });

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        setBackgroundType('image');
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle webcam background
  const startWebcam = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      videoRef.current = video;

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve);
        };
      });

      setBackgroundType('webcam');

      // Start rendering webcam feed
      const renderFrame = () => {
        if (backgroundType === 'webcam' && fabricCanvasRef.current && videoRef.current) {
          const canvas = fabricCanvasRef.current;
          const ctx = canvas.getContext();
          
          // Calculate dimensions to maintain aspect ratio
          const videoAspect = videoRef.current.videoWidth / videoRef.current.videoHeight;
          const canvasAspect = canvas.width / canvas.height;
          
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (videoAspect > canvasAspect) {
            drawHeight = canvas.width / videoAspect;
            offsetY = (canvas.height - drawHeight) / 2;
          } else {
            drawWidth = canvas.height * videoAspect;
            offsetX = (canvas.width - drawWidth) / 2;
          }

          // Clear the canvas and draw the video frame
          ctx.save();
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            videoRef.current,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
          );
          ctx.restore();

          // Render any Fabric.js objects on top
          canvas.renderAll(true);
        }
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast.error('Could not access webcam');
      setBackgroundType('color');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setBackgroundType('color');
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setBackgroundColor(backgroundColor, () => {
        fabricCanvasRef.current.renderAll();
      });
    }
  };

  // Load design image or worksheet
  useEffect(() => {
    if (!designNo) return;

    let isMounted = true;

    const loadDesign = async () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }

      setLoading(true);
      setError(null);

      try {
        if (viewMode === 'worksheet') {
          // Handle PDF worksheet using the new S3PDFViewer
          const pdfUrl = await getDesignWorksheet(designNo);
          
          if (!isMounted) return;

          setPdfUrl(pdfUrl);
          setPdfViewerVisible(true);
        } else {
          // Handle design image
          if (fabricCanvasRef.current) {
            // If we already have the image loaded, just update its properties
            if (imageObjectRef.current) {
              fabricCanvasRef.current.remove(imageObjectRef.current);
              imageObjectRef.current = null;
            }

            const imageUrl = await getDesignImage(designNo);

            if (!isMounted) return;

            fabric.Image.fromURL(imageUrl, (img) => {
              if (!isMounted || !img || !fabricCanvasRef.current) return;

              const canvas = fabricCanvasRef.current;
              const scale = Math.min(250 / img.width, 250 / img.height);
              
              img.scale(scale);
              
              img.set({
                left: (canvas.width - img.width * scale) / 2,
                top: (canvas.height - img.height * scale) / 2,
                hasControls: true,
                hasBorders: true,
                selectable: true,
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false,
                lockUniScaling: false,
                cornerColor: '#6699FF',
                cornerSize: 10,
                transparentCorners: false,
                borderColor: '#6699FF',
                borderScaleFactor: 2,
                padding: 5,
                cornerStyle: 'circle'
              });

              imageObjectRef.current = img;
              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.renderAll();

              // Clean up object URL
              URL.revokeObjectURL(imageUrl);
            }, { crossOrigin: 'anonymous' });
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading design:', error);
          setError(error.message || 'Failed to load design');
          toast.error(error.message || 'Failed to load design');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDesign();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [designNo, viewMode]);

  return (
    <div 
      ref={canvasWrapperRef} 
      className="w-full h-full relative bg-gray-50"
      style={{ 
        height: '100%',
        minHeight: '400px',
        maxHeight: '100%'
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-50">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      
      {/* Render S3PDFViewer for worksheet mode */}
      {viewMode === 'worksheet' && pdfUrl && (
        <div className="absolute inset-0 z-10 bg-white">
          <S3PDFViewer 
            s3Url={pdfUrl}
            scale={1.5}
            defaultToOriginal={true}
            onLoadSuccess={(data) => {
              currentPageRef.current = data.currentPage;
              if (pdfDocRef.current) {
                pdfDocRef.current.numPages = data.numPages;
              }
            }}
          />
        </div>
      )}
    </div>
  );
});