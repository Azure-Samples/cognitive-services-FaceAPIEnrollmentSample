import {enrollFeedbackAction} from '../feedback/enrollFeedbackAction';
import {FEEDBACK} from './filterFeedback';
import * as constants from '../../shared/constants';

var filtersRgb = constants.QUALITY_FILTER_RGB;
var filtersIr = constants.QUALITY_FILTER_IR;

export const filterFaceActionRgb = (face) => {
  return (dispatch) => {
    for (let filter of filtersRgb) {
      let feedback = filter(face);

      // Display feedback on screen
      dispatch(enrollFeedbackAction(feedback));
      if (feedback != FEEDBACK.none) {
        // A filter failed
        return false;
      }
    }

    // All filters passed
    return true;
  };
};

export const filterFaceActionIr = (face) => {
  return (dispatch) => {
    for (let filter of filtersIr) {
      let feedback = filter(face);

      // Display feedback on screen
      dispatch(enrollFeedbackAction(feedback));
      if (feedback != FEEDBACK.none) {
        // A filter failed
        return false;
      }
    }

    // All filters passed
    return true;
  };
};
