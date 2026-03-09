import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/chat/ChatScreen';
import { COLORS } from '../config/theme';

export type ChatStackParamList = {
  ChatMain: undefined;
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

const ChatStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: COLORS.primary,
      headerTitleStyle: { color: COLORS.text },
    }}
  >
    <Stack.Screen name="ChatMain" component={ChatScreen} options={{ title: 'Chat' }} />
  </Stack.Navigator>
);

export default ChatStackNavigator;
