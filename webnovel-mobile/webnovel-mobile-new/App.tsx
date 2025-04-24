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
import EditNovelScreen from './src/screens/EditNovelScreen';

const Stack = createNativeStackNavigator();

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Library"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#2a2a2a' },
              animation: 'slide_from_right',
              animationDuration: 300,
              animationTypeForReplace: 'push',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              presentation: 'card',
            }}
          >
            <Stack.Screen 
              name="Library" 
              component={LibraryScreen}
            />
            <Stack.Screen 
              name="NovelDetails" 
              component={NovelDetailsScreen}
            />
            <Stack.Screen 
              name="AddContent" 
              component={AddContentScreen}
            />
            <Stack.Screen 
              name="Reader" 
              component={ReaderScreen}
              options={{
                animation: 'fade',
                animationDuration: 200,
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
            />
            <Stack.Screen 
              name="EditNovel" 
              component={EditNovelScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
} 