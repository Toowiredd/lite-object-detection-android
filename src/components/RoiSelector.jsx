import React, { useState, useRef, useEffect } from 'react';

const RoiSelector = ({ onRoiChange }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [roi, setRoi] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const canvasRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsSelecting(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setRoi({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e) => {
    if (!isSelecting) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setRoi((prevRoi) => ({
      ...prevRoi,
      width: e.clientX - rect.left - prevRoi.x,
      height: e.clientY - rect.top - prevRoi.y,
    }));
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    onRoiChange(roi);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
  }, [roi]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth / 2}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="border"
    />
  );
};

export default RoiSelector;