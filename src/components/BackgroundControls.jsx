import { useState, useRef } from 'react';
import { Image as ImageIcon, Camera, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BackgroundControls({ 
  onImageSelect, 
  onWebcamStart, 
  onWebcamStop,
  backgroundType 
}) {
  const fileInputRef = useRef(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    onImageSelect(file);
  };

  const handleWebcamClick = () => {
    if (isWebcamActive) {
      setIsWebcamActive(false);
      onWebcamStop();
    } else {
      setIsWebcamActive(true);
      onWebcamStart();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <button
        onClick={handleImageClick}
        className={`p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 bg-white rounded-md border border-gray-200 ${
          backgroundType === 'image' ? 'ring-2 ring-primary' : ''
        }`}
        title="Use Image Background"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <button
        onClick={handleWebcamClick}
        className={`p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 bg-white rounded-md border border-gray-200 ${
          backgroundType === 'webcam' ? 'ring-2 ring-primary' : ''
        }`}
        title={isWebcamActive ? 'Stop Webcam' : 'Use Webcam Background'}
      >
        {isWebcamActive ? (
          <X className="h-4 w-4 text-red-500" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}