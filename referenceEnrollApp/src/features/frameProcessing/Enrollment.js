import React, {useEffect, useState, useRef} from 'react';
import {useDispatch} from 'react-redux';
import {
  verifyFaceAction,
  processFaceAction,
  trainAction,
  getFilteredFaceAction,
} from './processFrameAction';
import {View, StyleSheet} from 'react-native';
import EnrollProgress from '../progress/EnrollProgress';
import {CONFIG} from '../../env/env.json';
import {CancellationToken, sleep} from '../../shared/helper';
import CustomButton from '../../styles/CustomButton';
import {ENROLL_RESULT} from '../../shared/constants';
import {deleteEnrollmentAction} from '../userEnrollment/newEnrollmentAction';
import {mutex} from '../../shared/constants';

function Enrollment(props) {
  // State
  const [enrollStarted, setEnrollStarted] = useState(false);
  const [rgbProgress, setRgbProgress] = useState(0);
  const [cancelToken, setCancelToken] = useState(new CancellationToken());

  const progressRef = useRef(rgbProgress);

  // Keeps the progress state/ref value equal
  function updateProgress(newProgress) {
    progressRef.current = newProgress;
    setRgbProgress(newProgress);
  }

  // Dispatch
  const dispatch = useDispatch();

  // Detection
  const dispatchForDetection = async (frame) =>
    await dispatch(getFilteredFaceAction(frame));

  // Enrollment
  const dispatchForEnrollment = async (face, frame) =>
    await dispatch(processFaceAction(face, frame));

  // Verify
  const dispatchForVerify = async (face, frame) =>
    await dispatch(verifyFaceAction(face, frame));

  // Delete
  const dispatchDelete = async () => await dispatch(deleteEnrollmentAction());

  // Train
  const dispatchTrain = async () => await dispatch(trainAction());

  useEffect(() => {
    /*
        Create cancellation token when component mounts
        token will cancel during cancel click or timeout
    */
    //setCancelToken(new CancellationToken());
  }, []);

  // Runs entire enrollment flow
  const runEnrollment = async () => {
    console.log('ENROLLMENT BEGINS');
    const timeoutInMs = CONFIG.ENROLL_SETTINGS.TIMEOUT_SECONDS * 1000;

    let timer = setTimeout(() => {
      console.log('timeout triggers');
      cancelToken.timeoutCancel();
    }, timeoutInMs);

    // Add one to start up progress bar
    const rgbFramesToEnroll = CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL + 1;
    let tasks = [];
    let enrollmentSucceeded = false;
    let completedTaskCount = 0;

    // Give time for camera to adjust
    await sleep(6000);

    // Show initial progress
    updateProgress(progressRef.current + 1);

    const processFrame = async (frame) => {
      // Send frame for detection
      let face = await dispatchForDetection(frame);
      console.log('sending face for enrolling');
      if (face.faceId) {
        // Lock, only enroll/verify 1 face at a time
        let release = await mutex.acquire();

        if (cancelToken.isCancellationRequested == false) {
          if (progressRef.current < rgbFramesToEnroll) {
            // Send frame for enrollment
            let enrolled = await dispatchForEnrollment(face, frame);

            if (enrolled) {
              updateProgress(progressRef.current + 1);
            }
          } else if (progressRef.current == rgbFramesToEnroll) {
            // Send frame for verify
            let verified = await dispatchForVerify(face, frame);
            if (verified) {
              updateProgress(progressRef.current + 1);
              enrollmentSucceeded = true;
            }
          }
        }

        // Unlock
        release();
      }

      completedTaskCount++;
    };

    // Begin enrollment

    var i = 0;
    while (
      !enrollmentSucceeded &&
      cancelToken.isCancellationRequested == false &&
      i < 500
    ) {
      let frame = await props.takePicture();
      console.log('took pic ', frame);
      await sleep(10);
      if (frame) {
        // Prevent too many process requests
        if (completedTaskCount > tasks.length - 5) {
          tasks.push(processFrame(frame));
        }
      } else {
        console.log('issue');
      }
      i++;
    }

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
  }

  return (
    <View style={styles.root}>
      <View style={styles.overlay}>
        <EnrollProgress rgbProgressCount={rgbProgress} />
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
