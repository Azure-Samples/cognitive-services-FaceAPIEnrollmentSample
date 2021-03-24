import {useEffect, useState} from 'react';
import {Dimensions} from 'react-native';

const checkIsPortrait = () => {
  const dim = Dimensions.get('window');
  return dim.height >= dim.width;
};

// Hook updates isPortrait when orientation changes
export default function useIsPortrait() {
  const [isPortrait, setIsPortrait] = useState(checkIsPortrait());

  useEffect(() => {
    const callback = () => setIsPortrait(checkIsPortrait());

    Dimensions.addEventListener('change', callback);

    return () => {
      Dimensions.removeEventListener('change', callback);
    };
  }, []);

  return isPortrait;
}
