import {FEEDBACK} from './filterFeedback';
import {CONFIG} from '../../env/env.json';

const THRESHOLDS_RGB = CONFIG.QUALITY_FILTER_SETTINGS.RGB;
const THRESHOLDS_IR = CONFIG.QUALITY_FILTER_SETTINGS.IR;

export function createQualityFilterRgb() {
  let filters = [];

  for (let filter in THRESHOLDS_RGB) {
    filters.push(FILTER_MAP_RGB[filter]);
  }

  return filters;
}

export function createQualityFilterIr() {
  let filters = [];

  for (let filter in THRESHOLDS_IR) {
    filters.push(FILTER_MAP_IR[filter]);
  }

  return filters;
}

export function minimumFaceSizeRgb(detectResult) {
  return minimumFaceSize(detectResult, THRESHOLDS_RGB.MINIMUM_FACEAREA);
}

export function minimumFaceSizeIr(detectResult) {
  return minimumFaceSize(detectResult, THRESHOLDS_IR.MINIMUM_FACEAREA);
}

export function yawRgb(detectResult) {
  return yaw(detectResult, THRESHOLDS_RGB.YAW.MIN, THRESHOLDS_RGB.YAW.MAX);
}

export function yawIr(detectResult) {
  return yaw(detectResult, THRESHOLDS_IR.YAW.MIN, THRESHOLDS_IR.YAW.MAX);
}

export function pitchRgb(detectResult) {
  return pitch(
    detectResult,
    THRESHOLDS_RGB.PITCH.MIN,
    THRESHOLDS_RGB.PITCH.MAX,
  );
}

export function pitchIr(detectResult) {
  return pitch(detectResult, THRESHOLDS_IR.PITCH.MIN, THRESHOLDS_IR.PITCH.MAX);
}

export function rollRgb(detectResult) {
  return roll(detectResult, THRESHOLDS_RGB.ROLL.MIN, THRESHOLDS_RGB.ROLL.MAX);
}

export function rollIr(detectResult) {
  return pitch(detectResult, THRESHOLDS_IR.ROLL.MIN, THRESHOLDS_IR.ROLL.MAX);
}

export function occlusionForehead(detectResult) {
  if (detectResult.faceAttributes.occlusion.foreheadOccluded) {
    return FEEDBACK.occlusion;
  }

  return FEEDBACK.none;
}

export function occlusionEyes(detectResult) {
  if (detectResult.faceAttributes.occlusion.eyeOccluded) {
    return FEEDBACK.occlusion;
  }

  return FEEDBACK.none;
}

export function occlusionMouth(detectResult) {
  if (detectResult.faceAttributes.occlusion.mouthOccluded) {
    return FEEDBACK.occlusion;
  }

  return FEEDBACK.none;
}

export function exposureRgb(detectResult) {
  return exposure(
    detectResult,
    THRESHOLDS_RGB.EXPOSURE.UNDER,
    THRESHOLDS_RGB.EXPOSURE.OVER,
  );
}

export function exposureIr(detectResult) {
  return exposure(
    detectResult,
    THRESHOLDS_IR.EXPOSURE.UNDER,
    THRESHOLDS_IR.EXPOSURE.OVER,
  );
}

export function blurRgb(detectResult) {
  if (detectResult.faceAttributes.blur.value > THRESHOLDS_RGB.BLUR) {
    return FEEDBACK.blur;
  }

  return FEEDBACK.none;
}

export function noiseRgb(detectResult) {
  if (detectResult.faceAttributes.noise.value > THRESHOLDS_RGB.NOISE) {
    return FEEDBACK.noiseOrExposure;
  }

  return FEEDBACK.none;
}

export function sunglasses(detectResult) {
  let attributes = detectResult.faceAttributes;
  if (attributes.glasses == 'Sunglasses') {
    let sunglassesConfidence = 0;

    for (let accessorie of attributes.accessories) {
      if (accessorie.type == 'glasses') {
        sunglassesConfidence = accessorie.confidence;
      }
    }

    if (sunglassesConfidence >= THRESHOLDS_RGB.SUNGLASSES_CONFIDENCE) {
      return FEEDBACK.sunglassesOrMask;
    }
  }

  return FEEDBACK.none;
}

export function mask(detectResult) {
  let maskConfidence = 0;

  for (let accessorie of detectResult.faceAttributes.accessories) {
    if (accessorie.type == 'mask') {
      maskConfidence = accessorie.confidence;
    }

    if (maskConfidence >= THRESHOLDS_RGB.MASK_CONFIDENCE) {
      return FEEDBACK.sunglassesOrMask;
    }
  }

  return FEEDBACK.none;
}

function minimumFaceSize(detectResult, threshold) {
  let rect = detectResult.faceRectangle;
  let faceArea = rect.width * rect.height;

  if (faceArea < threshold) {
    return FEEDBACK.smallFace;
  }

  return FEEDBACK.none;
}

function yaw(detectResult, thresholdMin, thresholdMax) {
  let yaw = detectResult.faceAttributes.headPose.yaw;

  if (yaw < thresholdMin || yaw > thresholdMax) {
    return FEEDBACK.yawOrRoll;
  }

  return FEEDBACK.none;
}

function pitch(detectResult, thresholdMin, thresholdMax) {
  let pitch = detectResult.faceAttributes.headPose.pitch;

  if (pitch < thresholdMin || pitch > thresholdMax) {
    return FEEDBACK.pitch;
  }

  return FEEDBACK.none;
}

function roll(detectResult, thresholdMin, thresholdMax) {
  let roll = detectResult.faceAttributes.headPose.roll;

  if (roll < thresholdMin || roll > thresholdMax) {
    return FEEDBACK.yawOrRoll;
  }

  return FEEDBACK.none;
}

function exposure(detectResult, thresholdUnder, thresholdOver) {
  let exposure = detectResult.faceAttributes.exposure.value;

  if (exposure < thresholdUnder) {
    return FEEDBACK.noiseOrExposure;
  }

  if (exposure > thresholdOver) {
    return FEEDBACK.noiseOrExposure;
  }

  return FEEDBACK.none;
}

// An object to map filter config name to filter function name
// used for creating filters array
export const FILTER_MAP_RGB = Object.freeze({
  MINIMUM_FACEAREA: minimumFaceSizeRgb,
  YAW: yawRgb,
  PITCH: pitchRgb,
  ROLL: rollRgb,
  OCCLUSION_FOREHEAD: occlusionForehead,
  OCCLUSION_EYES: occlusionEyes,
  OCCLUSION_MOUTH: occlusionMouth,
  EXPOSURE: exposureRgb,
  BLUR: blurRgb,
  NOISE: noiseRgb,
  SUNGLASSES_CONFIDENCE: sunglasses,
  MASK_CONFIDENCE: mask,
});

export const FILTER_MAP_IR = Object.freeze({
  MINIMUM_FACEAREA: minimumFaceSizeIr,
  YAW: yawIr,
  PITCH: pitchIr,
  ROLL: rollIr,
  EXPOSURE: exposureIr,
});
