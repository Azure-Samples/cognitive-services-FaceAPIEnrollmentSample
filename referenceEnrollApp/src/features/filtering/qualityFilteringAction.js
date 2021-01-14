import {enrollFeedbackAction} from '../feedback/enrollFeedbackAction';
import {FEEDBACK} from './filterFeedback';
import * as constants from '../../shared/constants';

var filters = constants.QUALITY_FILTER;

export const filterFaceAction = (face) => {
  return (dispatch) => {
    for (let filter of filters) {
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
