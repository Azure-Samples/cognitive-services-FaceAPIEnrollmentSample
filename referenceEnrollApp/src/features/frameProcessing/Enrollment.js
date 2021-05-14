import React, {useEffect, useState, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
  verifyFaceAction,
  processFaceAction,
  trainAction,
  getFilteredFaceAction,
  getFilteredFaceForIrAction,
  getFilteredFaceforRgbAction,
} from './processFrameAction';
import {View, StyleSheet} from 'react-native';
import EnrollProgress from '../progress/EnrollProgress';
import {CONFIG} from '../../env/env.json';
import {CancellationToken, sleep} from '../../shared/helper';
import CustomButton from '../../styles/CustomButton';
import {ENROLL_RESULT} from '../../shared/constants';
import {
  deleteCurrentEnrollmentsAction,
  deleteEnrollmentAction,
  deleteNewEnrollmentsAction,
  updateEnrollmentAction,
} from '../userEnrollment/newEnrollmentAction';
import {mutexForRgb, mutexForIr} from '../../shared/constants';

function Enrollment(props) {
  // State
  const [enrollStarted, setEnrollStarted] = useState(false);
  const [rgbProgress, setRgbProgress] = useState(0);
  const [irProgress, setIrProgress] = useState(0);
  // This progress can be used for other completed tasks like initial startup
  const [progress, setProgress] = useState(0); 
  const [cancelToken, setCancelToken] = useState(new CancellationToken());
  const rgbProgressRef = useRef(rgbProgress);
  const irProgressRef = useRef(irProgress);
  const progressRef = useRef(progress);

  //get personIds:
  var newPersonIdRgb = useSelector(
    (state) => state.newEnrollment.newRgbPersonId,
  );
  var newPersonIdIr = useSelector((state) => state.newEnrollment.newIrPersonId);

  // Keeps the progress state/ref value equal
  function updateRgbProgress(newProgress) {
    rgbProgressRef.current = newProgress;
    setRgbProgress(newProgress);
  }

  function updateIrProgress(newProgress) {
    irProgressRef.current = newProgress;
    setIrProgress(newProgress);
  }

  function updateGeneralProgress(newProgress) {
    progressRef.current = newProgress;
    setProgress(newProgress);
  }

  function getTotalProgressVal(){
    // Enrollment updates progress on startup, so total must be 1 greater.
    let total = 1;

    if(CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL > 0){
      // add 1 for verify check
      total += CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL + 1; 
    }
    if(CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL > 0){
      // add 1 for verify check
      total += CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL + 1; 
    }

    return total;
  }

  // Dispatch
  const dispatch = useDispatch();

  // Detection
  const dispatchForRgbDetection = async (frame) =>
    await dispatch(getFilteredFaceforRgbAction(frame));

  // Detection
  const dispatchForIrDetection = async (frame) =>
    await dispatch(getFilteredFaceForIrAction(frame));

  // Enrollment
  const dispatchForEnrollment = async (face, frame, personGroup, personId) =>
    await dispatch(processFaceAction(face, frame, personGroup, personId));

  // Verify
  const dispatchForVerify = async (face, personGroup, personId) =>
    await dispatch(verifyFaceAction(face, personGroup, personId));

  // Delete
  const dispatchDelete = async () =>
    await dispatch(deleteNewEnrollmentsAction());

  // Train
  const dispatchTrain = async () => await dispatch(trainAction());

  // Update data
  const dispatchUpdateInfo = async () =>
    await dispatch(updateEnrollmentAction());

  useEffect(() => {
    /*
        Create cancellation token when component mounts
        token will cancel during cancel click or timeout
    */
    //setCancelToken(new CancellationToken());
  }, []);

  // Runs entire enrollment flow
  const runEnrollment = async () => {
    console.log('Enrollmen begins...');
    const timeoutInMs = CONFIG.ENROLL_SETTINGS.TIMEOUT_SECONDS * 1000;

    let timer = setTimeout(() => {
      console.log('timeout triggers');
      cancelToken.timeoutCancel();
    }, timeoutInMs);

    
    const rgbFramesToEnroll = CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL;
    const irFramesToEnroll = CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL;
    let tasksForRgb = [];
    let tasksForIr = [];
    let rgbEnrollmentSucceeded = false;
    let irEnrollmentSucceeded = false;
    let enrollmentSucceeded = false;
    let completedTaskCountRgb = 0;
    let completedTaskCountIr = 0;

    // Give time for camera to adjust
    await sleep(900);

    // Show initial progress
    updateGeneralProgress(progressRef.current + 1);

    const processRgbFrame = async (frame) => {
      // Send frame for detection
      let face = await dispatchForRgbDetection(frame);
      if (face.faceId) {
        // Lock, only enroll/verify 1 face at a time
        let release = await mutexForRgb.acquire();
        console.log('AQUIRED_RGB');
        if (cancelToken.isCancellationRequested == false) {
          if (rgbProgressRef.current < rgbFramesToEnroll) {
            // Send frame for enrollment
            let enrolled = await dispatchForEnrollment(
              face,
              frame,
              CONFIG.PERSONGROUP_RGB,
              newPersonIdRgb,
            );

            if (enrolled) {
              console.log('Enrolled rgb');
              updateRgbProgress(rgbProgressRef.current + 1);
            }
          } else if (rgbProgressRef.current == rgbFramesToEnroll) {
            // Send frame for verify
            let verified = await dispatchForVerify(
              face,
              CONFIG.PERSONGROUP_RGB,
              newPersonIdRgb,
            );
            if (verified) {
              updateRgbProgress(rgbProgressRef.current + 1);
              rgbEnrollmentSucceeded = true;
            }
          }
        }

        // Unlock
        release();
      }

      completedTaskCountRgb++;
    };

    const processIrFrame = async (frame) => {
      // Send frame for detection
      let face = await dispatchForIrDetection(frame);
      if (face.faceId) {
        // Lock, only enroll/verify 1 face at a time
        let releaseIr = await mutexForIr.acquire();
        console.log('AQUIRED_IR');

        if (cancelToken.isCancellationRequested == false) {
          if (irProgressRef.current < irFramesToEnroll) {
            // Send frame for enrollment
            console.log('Sending IR for enroll');
            let enrolled = await dispatchForEnrollment(
              face,
              frame,
              CONFIG.PERSONGROUP_IR,
              newPersonIdIr,
            );
            console.log('ENROLLED IR: ', enrolled);
            if (enrolled) {
              console.log('Enrolled IR');
              updateIrProgress(irProgressRef.current + 1);
            }
          } else if (irProgressRef.current == irFramesToEnroll) {
            // Send frame for verify
            let verified = await dispatchForVerify(
              face,
              CONFIG.PERSONGROUP_IR,
              newPersonIdIr,
            );
            if (verified) {
              updateIrProgress(irProgressRef.current + 1);
              irEnrollmentSucceeded = true;
            }
          }
        }

        // Unlock
        releaseIr();
      }

      completedTaskCountIr++;
    };

    const RgbEnrollment = async () => {
      while (
        rgbEnrollmentSucceeded == false &&
        cancelToken.isCancellationRequested == false
      ) {
        let frame = await props.takeColorPicture();
        await sleep(10);
        if (frame) {
          // Prevent too many process requests
          if (completedTaskCountRgb > tasksForRgb.length - 5) {
            tasksForRgb.push(processRgbFrame(frame));
          }
        } else {
          console.log('Failed to take picture');
        }
      }

      return rgbEnrollmentSucceeded;
    };

    const IrEnrollment = async () => {
      while (
        irEnrollmentSucceeded == false &&
        cancelToken.isCancellationRequested == false
      ) {
        let frame = await props.takeIrPicture();
        await sleep(10);
        if (frame) {
          // Prevent too many process requests
          if (completedTaskCountIr > tasksForIr.length - 5) {
            tasksForIr.push(processIrFrame(frame));
          }
        } else {
          console.log('Failed to take picture');
        }
      }

      return irEnrollmentSucceeded;
    };

    var rgbPromise = Promise.resolve(true);
    var irPromise = Promise.resolve(true);

    if (rgbFramesToEnroll > 0) {
      rgbPromise = RgbEnrollment();
    }
    if (irFramesToEnroll > 0) {
      irPromise = IrEnrollment();
    }

    var succeeded = await Promise.all([rgbPromise, irPromise]);
    enrollmentSucceeded = succeeded[0] && succeeded[1];

    console.log('Clearing timeout');
    clearTimeout(timer);

    if (enrollmentSucceeded == false) {
      // Enrollment failed, delete all data

      try {
        let deleteResult = await dispatchDelete();
        console.log('delete result', deleteResult);
      } catch (err) {
        console.log('delete failed', err);
      }

      // Determine type of failure result
      if (cancelToken.isTimeoutCancellation) {
        return ENROLL_RESULT.timeout;
      } else if (cancelToken.isCancellationRequested) {
        return ENROLL_RESULT.cancel;
      }

      return ENROLL_RESULT.error;
    }

    // Enrollment succeeded, dispatch train
    let trainResult = await dispatchTrain();

    console.log('train result:', trainResult);

    // update or save enrollment info
    var saved = await dispatchUpdateInfo();
    console.log('save data: ', saved);

    if (trainResult) {
      return ENROLL_RESULT.success;
    } else return ENROLL_RESULT.successNoTrain;
  };

  if (props.beginEnrollment && enrollStarted == false) {
    /* 
      Start Enrollment once parent component signals
      enrollment can begin and check enrollment hasn't aready started
    */

    setEnrollStarted(true);

    let t1 = performance.now();
    runEnrollment().then((enrollmentResult) => {
      props.onCompleted(enrollmentResult);
      let t2 = performance.now();

      console.log('Total enrollment time:', t2 - t1);
    });
   }

  function cancelEnrollment() {
    console.log('Cancel clicked');
    cancelToken.cancel();
    if(enrollStarted == false){
       props.onCompleted(ENROLL_RESULT.cancel);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.overlay}>
        <EnrollProgress progressCount={rgbProgress + irProgress + progress } total={getTotalProgressVal()} />
      </View>
      <CustomButton
        onPress={cancelEnrollment}
        title="Cancel"
        style={styles.cancelButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'absolute',
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  cancelButton: {
    margin: 40,
    backgroundColor: 'black',
    color: 'white',
    width: 100,
    fontSize: 20,
  },
});

export default Enrollment;
