import { FEEDBACK } from '../filtering/filterFeedback';

let initialState = {
  //message: 'The camera is having a hard time seeing your face in this light. If you can, adjust the lighting and try again.',
  message: 'ni'
};

const enrollFeedbackReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_FEEDBACK':
      // Don't process further requests if verifying
      if (state.message != FEEDBACK.verifying) {
        return {
          ...state,
          message: action.payload,
        };
      }
    default:
      return state;
  }
};

export default enrollFeedbackReducer;
