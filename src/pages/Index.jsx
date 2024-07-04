import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import RoiSelector from '@/components/RoiSelector';

const Index = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [roi, setRoi] = useState({ x: 0, y: 0, width: window.innerWidth / 2, height: window.innerHeight });
  const detectedObjects = useRef(new Set());
  const [objectCounts, setObjectCounts] = useState({ bottle: 0, can: 0, cardboard: 0, 'glass bottle': 0 });
  const workerRef = useRef(null);

  const loadModel = async () => {
    const loadedModel = await cocoSsd.load({ backend: 'webgl' });
    setModel(loadedModel);
  };

  const detectWebcamFeed = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const detect = async () => {
      if (video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        workerRef.current.postMessage({ type: 'processFrame', imageData });

        drawRoi(ctx);
      }
      requestAnimationFrame(detect);
    };
    detect();
  };

  const startWebcam = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        detectWebcamFeed();
      })
      .catch((err) => {
        console.error('Error accessing webcam: ', err);
      });
  };

  const drawRoi = (ctx) => {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
  };

  const handleRoiChange = (newRoi) => {
    setRoi(newRoi);
    workerRef.current.postMessage({ type: 'setRoi', roi: newRoi });
  };

  useEffect(() => {
    workerRef.current = new Worker(new URL('@/workers/offscreenDetectionWorker.js', import.meta.url), { type: 'module' });
    workerRef.current.postMessage({ type: 'loadModel' });

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'updateCounts') {
        setObjectCounts(e.data.objectCounts);
      }
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">TensorFlow.js Object Detection</CardTitle>
          <p className="text-lg">Use your webcam to detect objects.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button onClick={startWebcam}>Start Webcam</Button>
            <Separator />
            <RoiSelector onRoiChange={handleRoiChange} />
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