import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddContentScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#2a2a2a' }]}>
      <View style={styles.header}>
        <Button 
          icon="arrow-left" 
          mode="text" 
          onPress={() => navigation.goBack()}
          textColor="#fff"
        >
          Back
        </Button>
      </View>
      
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>Add New Content</Text>
        <Text style={styles.subtitle}>This screen will be implemented soon</Text>
        
        <Button 
          mode="contained" 
          style={styles.button}
          buttonColor="#7c4dff"
          onPress={() => navigation.goBack()}
        >
          Return to Library
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ccc',
    marginBottom: 32,
  },
  button: {
    marginTop: 24,
  }
});

export default AddContentScreen; 