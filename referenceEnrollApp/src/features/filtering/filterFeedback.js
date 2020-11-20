/* 
Feedback messages to display on UI when 
frames do not pass the quality filter
*/
export const FEEDBACK = Object.freeze({
  none: 'Looking good! Hold still while we take some pictures...',
  verifying: 'Processing your photos...',
  noFaceDetected: 'Center your face in the frame and look straight ahead.',
  smallFace: 'Bring your face closer to the camera.',
  yawOrRoll: 'Center your face in the frame and look straight ahead.',
  pitch: 'Look straight ahead at the screen.',
  occlusion:
    'Our camera is trying to get a good image. We appreciate your patience.',
  blur: 'Hold still while you look straight ahead. ',
  noiseOrExposure:
    'The camera is having a hard time seeing your face in this light. If you can, adjust the lighting and try again.',
  sunglassesOrMask: 'The camera is having trouble seeing your entire face.',
});
