import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image, Stamp, Save } from 'lucide-react';

const StampEditor = () => {
  const [image, setImage] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [draggedStamp, setDraggedStamp] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Basic stamp designs
  const basicStamps = [
    { id: 'vintage', label: 'Vintage Frame', color: '#8B4513', icon: <Stamp size={24} /> },
    { id: 'classic', label: 'Classic Corner', color: '#654321', icon: <Stamp size={24} /> },
    { id: 'retro', label: 'Retro Border', color: '#8B7355', icon: <Stamp size={24} /> },
  ];

  // Calculate and update image dimensions when image loads or container size changes
  useEffect(() => {
    const updateImageDimensions = () => {
      if (!imageRef.current || !containerRef.current) return;

      const img = imageRef.current;
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      // Calculate scaling to fit image within container
      const scale = Math.min(
        containerWidth / img.naturalWidth,
        containerHeight / img.naturalHeight
      );
      
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      
      // Calculate position to center image
      const x = (containerWidth - scaledWidth) / 2;
      const y = (containerHeight - scaledHeight) / 2;
      
      setImageDimensions({
        width: scaledWidth,
        height: scaledHeight,
        x,
        y
      });
    };

    const observer = new ResizeObserver(updateImageDimensions);
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    if (imageRef.current) {
      imageRef.current.onload = updateImageDimensions;
    }

    return () => {
      observer.disconnect();
    };
  }, [image]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addStamp = (stampId) => {
    if (!image || !containerRef.current) return;
    
    const stamp = basicStamps.find(s => s.id === stampId);
    const container = containerRef.current.getBoundingClientRect();
    
    setStamps([...stamps, {
      ...stamp,
      x: container.width / 2,
      y: container.height / 2,
    }]);
  };

  const handleStampMouseDown = (index, e) => {
    setDraggedStamp({
      index,
      offsetX: e.clientX - stamps[index].x,
      offsetY: e.clientY - stamps[index].y
    });
  };

  const handleMouseMove = (e) => {
    if (draggedStamp === null || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - draggedStamp.offsetX;
    const newY = e.clientY - draggedStamp.offsetY;

    setStamps(stamps.map((stamp, index) => 
      index === draggedStamp.index
        ? { ...stamp, x: newX, y: newY }
        : stamp
    ));
  };

  const handleMouseUp = () => {
    setDraggedStamp(null);
  };

  const handleStampDoubleClick = (index) => {
    setStamps(stamps.filter((_, i) => i !== index));
  };

  const saveImage = async () => {
    if (!containerRef.current || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match displayed image size
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;

    // Draw background image
    const img = imageRef.current;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw stamps (adjusting coordinates relative to image)
    stamps.forEach(stamp => {
      const relativeX = stamp.x - imageDimensions.x;
      const relativeY = stamp.y - imageDimensions.y;
      
      ctx.fillStyle = stamp.color;
      ctx.beginPath();
      ctx.arc(relativeX, relativeY, 24, 0, Math.PI * 2);
      ctx.fill();
    });

    // Add watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px sans-serif';
    const watermark = '© VintageEditor';
    const metrics = ctx.measureText(watermark);
    ctx.fillText(
      watermark,
      canvas.width - metrics.width - 10,
      canvas.height - 10
    );

    // Convert canvas to blob and handle saving
    canvas.toBlob(async (blob) => {
      try {
        const file = new File([blob], 'vintage-photo.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          // Use share API on mobile devices
          await navigator.share({
            files: [file],
            title: 'Save Photo',
          });
        } else {
          // Fallback to download for non-supporting devices
          const link = document.createElement('a');
          link.download = 'vintage-photo.png';
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href); // Clean up
        }
      } catch (error) {
        console.error('Error saving image:', error);
        // Fallback to basic download if sharing fails
        const link = document.createElement('a');
        link.download = 'vintage-photo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }, 'image/png');
  };

  // Calculate watermark position based on actual image dimensions
  const getWatermarkStyle = () => {
    if (!imageDimensions.width) return {};
    
    return {
      left: `${imageDimensions.x + imageDimensions.width - 150}px`,
      top: `${imageDimensions.y + imageDimensions.height - 30}px`
    };
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden" 
           ref={containerRef}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}>
        {image ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              ref={imageRef}
              src={image}
              alt="Uploaded"
              className="max-w-full max-h-full object-contain"
            />
            {stamps.map((stamp, index) => (
              <div
                key={index}
                className="absolute cursor-move"
                style={{ 
                  left: `${stamp.x}px`,
                  top: `${stamp.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseDown={(e) => handleStampMouseDown(index, e)}
                onDoubleClick={() => handleStampDoubleClick(index)}
              >
                <Stamp size={48} color={stamp.color} />
              </div>
            ))}
            {/* Watermark positioned relative to image */}
            <div 
              className="absolute text-white text-xs whitespace-nowrap bg-black bg-opacity-50 px-1.5 py-0.5 rounded-sm pointer-events-none"
              style={getWatermarkStyle()}
            >
              © VintageEditor
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Image size={48} className="mx-auto mb-2" />
              <p>Upload an image to start editing</p>
            </div>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <label className={`flex flex-col items-center p-2 cursor-pointer ${activeTab === 'upload' ? 'text-blue-500' : 'text-gray-600'}`}>
            <UploadCloud size={24} />
            <span className="text-xs mt-1">Upload</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
          {basicStamps.map((stamp) => (
            <button
              key={stamp.id}
              onClick={() => {
                setActiveTab(stamp.id);
                addStamp(stamp.id);
              }}
              className={`flex flex-col items-center p-2 ${activeTab === stamp.id ? 'text-blue-500' : 'text-gray-600'}`}
              disabled={!image}
            >
              {stamp.icon}
              <span className="text-xs mt-1">{stamp.label.split(' ')[0]}</span>
            </button>
          ))}
          <button
            onClick={saveImage}
            disabled={!image}
            className={`flex flex-col items-center p-2 ${!image ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <Save size={24} />
            <span className="text-xs mt-1">Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StampEditor;