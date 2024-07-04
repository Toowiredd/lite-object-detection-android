import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const RealTimeTraining = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [roi, setRoi] = useState({ x: 0, y: 0, width: window.innerWidth / 2, height: window.innerHeight });
  const detectedObjects = useRef(new Set());
  const [objectCounts, setObjectCounts] = useState({ bottle: 0, can: 0, cardboard: 0, 'glass bottle': 0 });

  const [petBottleImage, setPetBottleImage] = useState(null);
  const [hdpeBottleImage, setHdpeBottleImage] = useState(null);
  const [aluminiumCanImage, setAluminiumCanImage] = useState(null);
  const [cardboardCartonImage, setCardboardCartonImage] = useState(null);

  const loadModel = async () => {
    const loadedModel = await cocoSsd.load({ backend: 'webgl' });
    setModel(loadedModel);
  };

  const handleFileUpload = (event, setImage) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
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

        const predictions = await model.detect(video, { maxNumBoxes: 10, minScore: 0.5 });
        const filteredPredictions = predictions.filter(prediction => 
          ['bottle', 'can', 'cardboard', 'glass bottle'].includes(prediction.class)
        );

        filteredPredictions.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = 'red';
          ctx.fillText(
            `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
            x,
            y > 10 ? y - 5 : 10
          );

          if (isInRoi(x, y, width, height) && !detectedObjects.current.has(prediction.bbox.toString())) {
            detectedObjects.current.add(prediction.bbox.toString());
            updateObjectCounts(prediction.class);
            toast.success(`Detected ${prediction.class}`);
          }
        });

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

  const isInRoi = (x, y, width, height) => {
    return (
      x < roi.x + roi.width &&
      x + width > roi.x &&
      y < roi.y + roi.height &&
      y + height > roi.y
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
          <CardTitle className="text-3xl">Real-Time Training</CardTitle>
          <p className="text-lg">Use your webcam to train the model in real-time.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button onClick={startWebcam}>Start Webcam</Button>
            <Separator />
            <canvas ref={canvasRef} className="border" />
            <video ref={videoRef} className="hidden" />
            <div className="mt-4">
              <h2 className="text-2xl">Upload Sample Photos</h2>
              <div className="space-y-2">
                <div>
                  <label htmlFor="petBottle">PET Bottle:</label>
                  <Input type="file" id="petBottle" onChange={(e) => handleFileUpload(e, setPetBottleImage)} />
                </div>
                <div>
                  <label htmlFor="hdpeBottle">HDPE Bottle:</label>
                  <Input type="file" id="hdpeBottle" onChange={(e) => handleFileUpload(e, setHdpeBottleImage)} />
                </div>
                <div>
                  <label htmlFor="aluminiumCan">Aluminium Can:</label>
                  <Input type="file" id="aluminiumCan" onChange={(e) => handleFileUpload(e, setAluminiumCanImage)} />
                </div>
                <div>
                  <label htmlFor="cardboardCarton">Cardboard Carton:</label>
                  <Input type="file" id="cardboardCarton" onChange={(e) => handleFileUpload(e, setCardboardCartonImage)} />
                </div>
              </div>
            </div>
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

export default RealTimeTraining;