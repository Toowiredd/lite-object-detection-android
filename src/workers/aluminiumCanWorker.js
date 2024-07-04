import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

let model;

onmessage = async (e) => {
  if (e.data === 'loadModel') {
    model = await cocoSsd.load({ backend: 'webgl' });
    postMessage('modelLoaded');
  } else {
    const { imageData, roi } = e.data;
    const predictions = await model.detect(imageData, { maxNumBoxes: 10, minScore: 0.5 });
    const filteredPredictions = predictions.filter(prediction => 
      ['can'].includes(prediction.class)
    );
    postMessage(filteredPredictions);
  }
};