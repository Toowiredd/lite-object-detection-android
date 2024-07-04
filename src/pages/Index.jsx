import React, { useState, useRef, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

const Index = () => {
  const [image, setImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [manualTags, setManualTags] = useState([]);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [roi, setRoi] = useState({ x: 0, y: 0, width: window.innerWidth / 2, height: window.innerHeight });
  const [tally, setTally] = useState({ PET1: 0, HDPE2: 0, cardboard: 0, aluminum: 0 });
  const detectedObjects = useRef(new Set());
  const [swapRoi, setSwapRoi] = useState(false);
  const [manualVerification, setManualVerification] = useState(false);

  const loadModel = async () => {
    const loadedModel = await cocoSsd.load({ backend: 'webgl' });
    setModel(loadedModel);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      detectObjects(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const detectObjects = async (imageSrc) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const predictions = await model.detect(img, { maxNumBoxes: 10, minScore: 0.5 });
      const filteredPredictions = predictions.filter(prediction => 
        ['bottle', 'can', 'cardboard', 'glass bottle'].includes(prediction.class)
      );
      setDetections(filteredPredictions);

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
          incrementTally(prediction.class);
          detectedObjects.current.add(prediction.bbox.toString());
        }
      });

      drawRoi(ctx);
    };
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
        setDetections(filteredPredictions);

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
            incrementTally(prediction.class);
            detectedObjects.current.add(prediction.bbox.toString());
          }
        });

        drawRoi(ctx);
      }
      requestAnimationFrame(detect);
    };
    detect();
  };

  const isInRoi = (x, y, width, height) => {
    return (
      x < roi.x + roi.width &&
      x + width > roi.x &&
      y < roi.y + roi.height &&
      y + height > roi.y
    );
  };

  const incrementTally = (objectClass) => {
    if (objectClass === 'bottle') {
      setTally((prevTally) => ({ ...prevTally, PET1: prevTally.PET1 + 1 }));
    } else if (objectClass === 'cardboard') {
      setTally((prevTally) => ({ ...prevTally, cardboard: prevTally.cardboard + 1 }));
    } else if (objectClass === 'can') {
      setTally((prevTally) => ({ ...prevTally, aluminum: prevTally.aluminum + 1 }));
    }
  };

  const drawRoi = (ctx) => {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
  };

  const handleManualTag = (tag) => {
    setManualTags([...manualTags, tag]);
  };

  const countObjects = (objectClass) => {
    const autoCount = detections.filter(d => d.class === objectClass).length;
    const manualCount = manualTags.filter(tag => tag === objectClass).length;
    return autoCount + manualCount;
  };

  const countGlassBottles = () => {
    return countObjects('bottle');
  };

  const handleSwapRoi = () => {
    setSwapRoi(!swapRoi);
    setRoi((prevRoi) => ({
      ...prevRoi,
      x: window.innerWidth - prevRoi.x - prevRoi.width,
    }));
  };

  useEffect(() => {
    loadModel();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">TensorFlow.js Object Detection</CardTitle>
          <p className="text-lg">Upload an image or use your webcam to detect objects.</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="detection">
            <TabsList>
              <TabsTrigger value="detection">Detection</TabsTrigger>
              <TabsTrigger value="count">Count</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="detection">
              <div className="flex flex-col items-center space-y-4">
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                <Button onClick={startWebcam}>Start Webcam</Button>
                <Separator />
                <canvas ref={canvasRef} className="border" />
                <video ref={videoRef} className="hidden" />
              </div>
            </TabsContent>
            <TabsContent value="count">
              <div className="w-full">
                <h2 className="text-xl">Detection Results:</h2>
                <ul>
                  {detections.map((detection, index) => (
                    <li key={index}>
                      {detection.class} - {Math.round(detection.score * 100)}%
                    </li>
                  ))}
                </ul>
                <Separator />
                <h2 className="text-xl">Manual Tags:</h2>
                <ul>
                  {manualTags.map((tag, index) => (
                    <li key={index}>{tag}</li>
                  ))}
                </ul>
                <Separator />
                <h2 className="text-xl">Object Counts:</h2>
                <p>Glass Bottles: {countGlassBottles()}</p>
                <p>Total Objects: {detections.length + manualTags.length}</p>
                <p>PET 1 Plastic Bottles: {tally.PET1}</p>
                <p>HDPE 2 Plastic Bottles: {tally.HDPE2}</p>
                <p>Cardboard Cartons: {tally.cardboard}</p>
                <p>Aluminum Cans: {tally.aluminum}</p>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <div className="w-full">
                <h2 className="text-xl">Settings:</h2>
                <div className="flex items-center space-x-2">
                  <label>Swap ROI Direction</label>
                  <Switch checked={swapRoi} onCheckedChange={handleSwapRoi} />
                </div>
                <div className="flex items-center space-x-2">
                  <label>Manual Verification</label>
                  <Switch checked={manualVerification} onCheckedChange={setManualVerification} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;