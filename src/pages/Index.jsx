import React, { useRef, useEffect, useState } from 'react';
import { Objectron } from '@mediapipe/objectron';
import { Camera } from '@mediapipe/camera_utils';
import { drawLandmarks } from '@mediapipe/drawing_utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const Index = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [objectron, setObjectron] = useState(null);
  const [roi, setRoi] = useState({ x: 0, y: 0, width: window.innerWidth / 2, height: window.innerHeight });
  const detectedObjects = useRef(new Set());
  const [objectCounts, setObjectCounts] = useState({ bottle: 0, can: 0, cardboard: 0, 'glass bottle': 0 });

  const loadModel = async () => {
    const objectron = new Objectron({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/objectron/${file}`});
    objectron.setOptions({
      model: 'Shoe',
      maxNumObjects: 5,
    });
    objectron.onResults(onResults);
    setObjectron(objectron);
  };

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    if (results.objectDetections.length > 0) {
      for (const detectedObject of results.objectDetections) {
        drawLandmarks(ctx, detectedObject.landmarks, {color: 'red', lineWidth: 2});
        if (isInRoi(detectedObject.boundingBox)) {
          const objectClass = 'shoe'; // MediaPipe Objectron currently supports shoes, cups, chairs, and cameras
          if (!detectedObjects.current.has(detectedObject.boundingBox.toString())) {
            detectedObjects.current.add(detectedObject.boundingBox.toString());
            updateObjectCounts(objectClass);
            toast.success(`Detected ${objectClass}`);
          }
        }
      }
    }
    drawRoi(ctx);
    ctx.restore();
  };

  const startWebcam = () => {
    const videoElement = videoRef.current;
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await objectron.send({image: videoElement});
      },
      width: 1280,
      height: 720,
    });
    camera.start();
  };

  const isInRoi = (boundingBox) => {
    const {xCenter, yCenter, width, height} = boundingBox;
    return (
      xCenter < roi.x + roi.width &&
      xCenter + width > roi.x &&
      yCenter < roi.y + roi.height &&
      yCenter + height > roi.y
    );
  };

  const drawRoi = (ctx) => {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
  };

  const updateObjectCounts = (objectClass) => {
    setObjectCounts(prevCounts => ({
      ...prevCounts,
      [objectClass]: prevCounts[objectClass] + 1
    }));
  };

  useEffect(() => {
    loadModel();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">MediaPipe Object Detection</CardTitle>
          <p className="text-lg">Use your webcam to detect objects.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button onClick={startWebcam}>Start Webcam</Button>
            <Separator />
            <canvas ref={canvasRef} className="border" />
            <video ref={videoRef} className="hidden" />
            <div className="mt-4">
              <h2 className="text-2xl">Detected Objects</h2>
              <ul>
                {Object.entries(objectCounts).map(([objectClass, count]) => (
                  <li key={objectClass}>{objectClass}: {count}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;