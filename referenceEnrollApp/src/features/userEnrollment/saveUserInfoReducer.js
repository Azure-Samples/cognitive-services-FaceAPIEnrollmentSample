const initialState = {
  username: '',
  existingRgbPersonId: '',
  existingIrPersonId: '',
};

const saveUserInfoReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SAVE_USERINFO':
      return {
        ...state,
        username: action.payload.username,
        existingRgbPersonId: action.payload.personIdRgb,
        existingIrPersonId: action.payload.personIdIr,
      };
    default:
      return state;
  }
};

export default saveUserInfoReducer;
