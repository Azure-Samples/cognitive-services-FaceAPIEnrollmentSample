import allReducers from './allReducers';

// Resets the store to inital state
const rootReducer = (state, action) => {
  if (action.type === 'USER_LOGOUT') {
    state = undefined;
  }

  return allReducers(state, action);
};

export default rootReducer;
