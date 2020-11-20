import {combineReducers} from 'redux';

import saveUserInfoReducer from '../features/userEnrollment/saveUserInfoReducer';
import enrollFeedbackReducer from '../features/feedback/enrollFeedbackReducer';
import newEnrollmentReducer from '../features/userEnrollment/newEnrollmentReducer';

const allReducers = combineReducers({
  userInfo: saveUserInfoReducer,
  feedback: enrollFeedbackReducer,
  newEnrollment: newEnrollmentReducer,
});

export default allReducers;
