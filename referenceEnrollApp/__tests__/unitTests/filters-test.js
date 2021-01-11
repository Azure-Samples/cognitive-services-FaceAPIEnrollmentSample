/**
 * @format
 */

import 'react-native';
import React from 'react';
import * as filter from '../../src/features/filtering/filters';
import {detectionResult} from '../testData/detectResult.json';
import {FEEDBACK} from '../../src/features/filtering/filterFeedback';

const face = detectionResult[0];

// Minimum Face size
it('Minimum Face size - pass ', () => {
  face.faceRectangle.height = 60;
  face.faceRectangle.width = 60;
  expect(filter.minimumFaceSize(face)).toBe(FEEDBACK.none);
});

it('Minimum Face size - fail', () => {
  face.faceRectangle.height = 20;
  face.faceRectangle.width = 20;

  expect(filter.minimumFaceSize(face)).toBe(FEEDBACK.smallFace);
});

// Yaw
it('Yaw - pass', () => {
  face.faceAttributes.headPose.yaw = 25;

  expect(filter.yaw(face)).toBe(FEEDBACK.none);
});

it('Yaw - fail', () => {
  face.faceAttributes.headPose.yaw = -25.1;

  expect(filter.yaw(face)).toBe(FEEDBACK.yawOrRoll);
});

// Pitch
it('Pitch - pass', () => {
  face.faceAttributes.headPose.pitch = 25;

  expect(filter.pitch(face)).toBe(FEEDBACK.none);
});

it('Pitch - fail', () => {
  face.faceAttributes.headPose.pitch = -25.1;

  expect(filter.pitch(face)).toBe(FEEDBACK.pitch);
});

// Roll
it('Roll - pass', () => {
  face.faceAttributes.headPose.roll = 20;

  expect(filter.roll(face)).toBe(FEEDBACK.none);
});

it('Roll - fail', () => {
  face.faceAttributes.headPose.roll = -20.1;

  expect(filter.roll(face)).toBe(FEEDBACK.yawOrRoll);
});

// Occlusion forehead
it('Occlusion forehead - pass', () => {
  face.faceAttributes.occlusion.foreheadOccluded = false;

  expect(filter.occlusionForehead(face)).toBe(FEEDBACK.none);
});

it('Occlusion forehead - fail', () => {
  face.faceAttributes.occlusion.foreheadOccluded = true;

  expect(filter.occlusionForehead(face)).toBe(FEEDBACK.occlusion);
});

// Occlusion eyes
it('Occlusion eyes - pass', () => {
  face.faceAttributes.occlusion.eyeOccluded = false;

  expect(filter.occlusionEyes(face)).toBe(FEEDBACK.none);
});

it('Occlusion eyes - fail', () => {
  face.faceAttributes.occlusion.eyeOccluded = true;

  expect(filter.occlusionEyes(face)).toBe(FEEDBACK.occlusion);
});

// Occlusion mouth
it('Occlusion mouth - pass', () => {
  face.faceAttributes.occlusion.mouthOccluded = false;

  expect(filter.occlusionMouth(face)).toBe(FEEDBACK.none);
});

it('Occlusion mouth - fail', () => {
  face.faceAttributes.occlusion.mouthOccluded = true;

  expect(filter.occlusionMouth(face)).toBe(FEEDBACK.occlusion);
});

// Under Exposure
it('Under Exposure - pass', () => {
  face.faceAttributes.exposure.value = '0.25';

  expect(filter.exposure(face)).toBe(FEEDBACK.none);
});

it('Under Exposure - pass', () => {
  face.faceAttributes.exposure.value = '0.24';

  expect(filter.exposure(face)).toBe(FEEDBACK.noiseOrExposure);
});

// Over Exposure
it('Over Exposure - pass', () => {
  face.faceAttributes.exposure.value = '0.75';

  expect(filter.exposure(face)).toBe(FEEDBACK.none);
});

it('Over Exposure - pass', () => {
  face.faceAttributes.exposure.value = '0.76';

  expect(filter.exposure(face)).toBe(FEEDBACK.noiseOrExposure);
});

// Noise
it('Noise - pass', () => {
  face.faceAttributes.noise.value = '0.3';

  expect(filter.noise(face)).toBe(FEEDBACK.none);
});

it('Noise - fail', () => {
  face.faceAttributes.noise.value = '0.31';

  expect(filter.noise(face)).toBe(FEEDBACK.noiseOrExposure);
});

// Blur
it('Blur - pass', () => {
  face.faceAttributes.blur.value = '0.3';

  expect(filter.blur(face)).toBe(FEEDBACK.none);
});

it('Blur - fail', () => {
  face.faceAttributes.blur.value = '0.31';

  expect(filter.blur(face)).toBe(FEEDBACK.blur);
});

// Sunglasses
it('Sunglasses - pass', () => {
  face.faceAttributes.accessories.type = 'NoGlasses';

  expect(filter.sunglasses(face)).toBe(FEEDBACK.none);
});

it('Sunglasses - fail', () => {
  face.faceAttributes.glasses = 'Sunglasses';

  expect(filter.sunglasses(face)).toBe(FEEDBACK.sunglassesOrMask);
});

// Mask
it('Mask - pass', () => {
  expect(filter.mask(face)).toBe(FEEDBACK.sunglassesOrMask);
});

it('Mask - fail', () => {
  face.faceAttributes.accessories = [
    {
      type: 'mask',
      confidence: 0.5,
    },
  ];
  expect(filter.mask(face)).toBe(FEEDBACK.none);
});
