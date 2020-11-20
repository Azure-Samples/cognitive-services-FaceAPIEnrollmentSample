let initialState = {
  message: '',
};

const enrollFeedbackReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_FEEDBACK':
      return {
        ...state,
        message: action.payload,
      };
    default:
      return state;
  }
};

export default enrollFeedbackReducer;
