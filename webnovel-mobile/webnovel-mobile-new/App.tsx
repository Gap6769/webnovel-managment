import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import screens
import LibraryScreen from './src/screens/LibraryScreen';
import NovelDetailsScreen from './src/screens/NovelDetailsScreen';
import AddContentScreen from './src/screens/AddContentScreen';
import ReaderScreen from './src/screens/ReaderScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Library">
            <Stack.Screen 
              name="Library" 
              component={LibraryScreen}
              options={{ title: 'My Library' }}
            />
            <Stack.Screen 
              name="NovelDetails" 
              component={NovelDetailsScreen}
              options={{ title: 'Novel Details' }}
            />
            <Stack.Screen 
              name="AddContent" 
              component={AddContentScreen}
              options={{ title: 'Add New Content' }}
            />
            <Stack.Screen 
              name="Reader" 
              component={ReaderScreen}
              options={{ title: 'Reader' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
} 