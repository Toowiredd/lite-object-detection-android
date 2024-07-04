import React, { useState, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Index = () => {
  const [image, setImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [manualTags, setManualTags] = useState([]);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);

  const loadModel = async () => {
    const loadedModel = await cocoSsd.load();
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

      const predictions = await model.detect(img);
      setDetections(predictions);

      predictions.forEach((prediction) => {
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
      });
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

        const predictions = await model.detect(video);
        setDetections(predictions);

        predictions.forEach((prediction) => {
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
        });
      }
      requestAnimationFrame(detect);
    };
    detect();
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

  React.useEffect(() => {
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
          <div className="flex flex-col items-center space-y-4">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <Button onClick={startWebcam}>Start Webcam</Button>
            <Separator />
            <canvas ref={canvasRef} className="border" />
            <video ref={videoRef} className="hidden" />
            <Separator />
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
            </div>
            <Separator />
            <div className="w-full">
              <h2 className="text-xl">Manual Tagging:</h2>
              <Button onClick={() => handleManualTag('bottle')}>Tag Glass Bottle</Button>
              <Button onClick={() => handleManualTag('custom-object')}>Tag Custom Object</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;