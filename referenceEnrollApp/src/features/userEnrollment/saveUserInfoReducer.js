const initialState = {
  username: '',
  rgbPersonId: '',
  irPersonId: '',
};

const saveUserInfoReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SAVE_USERINFO':
      return {
        ...state,
        username: action.payload.username,
        rgbPersonId: action.payload.personIdRgb,
        irPersonId: action.payload.personIdIr,
      };
    default:
      return state;
  }
};

export default saveUserInfoReducer;
