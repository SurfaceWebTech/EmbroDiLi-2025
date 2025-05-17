import { useState, useEffect, useRef } from 'react';
import { Palette } from 'lucide-react';

export default function ColorPicker({ onColorChange, initialColor = '#f9fafb' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [color, setColor] = useState(initialColor);
  const [hexValue, setHexValue] = useState(initialColor);
  const popoverRef = useRef(null);
  const canvasRef = useRef(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && canvasRef.current && sliderRef.current) {
      drawColorPanel();
      drawHueSlider();
    }
  }, [isOpen]);

  const drawColorPanel = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Draw saturation and lightness gradient
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const saturation = (x / width) * 100;
        const lightness = ((height - y) / height) * 100;
        ctx.fillStyle = `hsl(0, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  const drawHueSlider = () => {
    const canvas = sliderRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Create hue gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i <= 360; i += 60) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const handlePanelClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const saturation = (x / canvas.width) * 100;
    const lightness = ((canvas.height - y) / canvas.height) * 100;
    
    const newColor = `hsl(0, ${saturation}%, ${lightness}%)`;
    setColor(newColor);
    setHexValue(hslToHex(0, saturation, lightness));
    onColorChange(newColor);
  };

  const handleHueClick = (e) => {
    const canvas = sliderRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const hue = (x / canvas.width) * 360;
    const newColor = `hsl(${hue}, 100%, 50%)`;
    setColor(newColor);
    setHexValue(hslToHex(hue, 100, 50));
    onColorChange(newColor);
  };

  const handleHexChange = (e) => {
    const hex = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setHexValue(hex);
      setColor(hex);
      onColorChange(hex);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 bg-white rounded-md border border-gray-200"
        style={{ backgroundColor: color }}
        title="Change Background Color"
      >
        <Palette className="h-4 w-4" style={{ color: getContrastColor(color) }} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="space-y-4">
            {/* Color Panel */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width="200"
                height="200"
                className="rounded cursor-crosshair"
                onClick={handlePanelClick}
              />
            </div>

            {/* Hue Slider */}
            <div className="relative">
              <canvas
                ref={sliderRef}
                width="200"
                height="20"
                className="rounded cursor-pointer"
                onClick={handleHueClick}
              />
            </div>

            {/* Hex Input */}
            <div>
              <input
                type="text"
                value={hexValue}
                onChange={handleHexChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="#000000"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onColorChange(color);
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-dark"
              >
                Choose
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to determine text color based on background color
function getContrastColor(color) {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
  
  // For HSL colors
  const match = color.match(/hsl\([\d.]+,\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (match) {
    const lightness = parseFloat(match[2]);
    return lightness > 60 ? '#000000' : '#ffffff';
  }
  
  return '#000000';
}

// Helper function to convert HSL to Hex
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}