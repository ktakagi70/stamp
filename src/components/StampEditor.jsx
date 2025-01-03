import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image, Stamp, Save } from 'lucide-react';

const StampEditor = () => {
  const [image, setImage] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [draggedStamp, setDraggedStamp] = useState(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Basic stamp designs
  const basicStamps = [
    { id: 'vintage', label: 'Vintage Frame', color: '#8B4513', icon: <Stamp size={24} /> },
    { id: 'classic', label: 'Classic Corner', color: '#654321', icon: <Stamp size={24} /> },
    { id: 'retro', label: 'Retro Border', color: '#8B7355', icon: <Stamp size={24} /> },
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
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

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900">
      {/* Main Content Area - Takes all available space except tab bar */}
      <div 
        className="flex-1 relative w-full overflow-hidden"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {image ? (
            <div className="relative w-full h-full flex items-center justify-center">
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
              {/* Watermark */}
              <div 
                className="absolute text-white text-xs whitespace-nowrap bg-black bg-opacity-50 px-1.5 py-0.5 rounded-sm pointer-events-none"
                style={image ? {
                  right: '8px',
                  bottom: '8px'
                } : {}}
              >
                © VintageEditor
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center">
              <Image size={48} className="mx-auto mb-2" />
              <p>Upload an image to start editing</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar - Fixed at bottom */}
      <div className="w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-lg mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            <label className={`flex flex-col items-center p-2 cursor-pointer ${activeTab === 'upload' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}`}>
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
                className={`flex flex-col items-center p-2 ${
                  activeTab === stamp.id 
                    ? 'text-blue-500' 
                    : 'text-gray-600 dark:text-gray-400'
                } ${!image ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-500'}`}
                disabled={!image}
              >
                {stamp.icon}
                <span className="text-xs mt-1">{stamp.label.split(' ')[0]}</span>
              </button>
            ))}
            <button
              onClick={() => {}}
              disabled={!image}
              className={`flex flex-col items-center p-2 ${
                !image 
                  ? 'text-gray-400 opacity-50 cursor-not-allowed' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
              }`}
            >
              <Save size={24} />
              <span className="text-xs mt-1">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampEditor;