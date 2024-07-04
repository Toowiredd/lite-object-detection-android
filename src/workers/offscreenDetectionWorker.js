import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

let model;
let roi = { x: 0, y: 0, width: 0, height: 0 };
let objectCounts = { bottle: 0, can: 0, cardboard: 0, 'glass bottle': 0 };

onmessage = async (e) => {
  if (e.data.type === 'loadModel') {
    model = await cocoSsd.load({ backend: 'webgl' });
    postMessage({ type: 'modelLoaded' });
  } else if (e.data.type === 'setRoi') {
    roi = e.data.roi;
  } else if (e.data.type === 'processFrame') {
    const { imageData } = e.data;
    const predictions = await model.detect(imageData, { maxNumBoxes: 10, minScore: 0.5 });
    const filteredPredictions = predictions.filter(prediction => 
      ['bottle', 'can', 'cardboard', 'glass bottle'].includes(prediction.class)
    );

    filteredPredictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      if (isInRoi(x, y, width, height)) {
        objectCounts[prediction.class] += 1;
      }
    });

    postMessage({ type: 'updateCounts', objectCounts });
  }
};

const isInRoi = (x, y, width, height) => {
  return (
    x < roi.x + roi.width &&
    x + width > roi.x &&
    y < roi.y + roi.height &&
    y + height > roi.y
  );
};