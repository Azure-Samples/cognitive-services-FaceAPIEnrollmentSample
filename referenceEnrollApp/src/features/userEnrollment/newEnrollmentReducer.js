const initialState = {
  newRgbPersonId: '',
  newIrPersonId: '',
};

const newEnrollmentReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SAVE_NEW_ENROLLMENT':
      return {
        ...state,
        newRgbPersonId: action.payload.personIdRgb,
        newIrPersonId: action.payload.personIdIr,
      };
    default:
      return state;
  }
};

export default newEnrollmentReducer;
