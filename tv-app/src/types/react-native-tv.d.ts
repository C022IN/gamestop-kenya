// Augment the upstream React Native types with react-native-tvos-specific props.
// isTVSelectable and hasTVPreferredFocus exist on all touchable/pressable
// components in RNTVOS but are not declared in the upstream @types/react-native.

import 'react-native';

declare module 'react-native' {
  interface TouchableHighlightProps {
    isTVSelectable?: boolean;
    hasTVPreferredFocus?: boolean;
  }
  interface TouchableOpacityProps {
    isTVSelectable?: boolean;
    hasTVPreferredFocus?: boolean;
  }
  interface PressableProps {
    isTVSelectable?: boolean;
    hasTVPreferredFocus?: boolean;
  }
  interface TextInputProps {
    hasTVPreferredFocus?: boolean;
  }
}
