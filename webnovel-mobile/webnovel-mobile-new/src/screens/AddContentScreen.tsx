import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput, useTheme, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateNovel } from '../api/contentApi';

const AddContentScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    source_url: '',
    source_name: '',
    source_language: '',
    type: 'novel' as const
  });

  const createNovel = useCreateNovel();

  const handleSubmit = async () => {
    try {
      await createNovel.mutateAsync(formData);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating novel:', error);
    }
  };

  const handleChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
      
      <ScrollView style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>Add New Novel</Text>
        
        <TextInput
          label="Title"
          value={formData.title}
          onChangeText={handleChange('title')}
          style={styles.input}
          mode="outlined"
          textColor="#fff"
          outlineColor="#444"
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="Source URL"
          value={formData.source_url}
          onChangeText={handleChange('source_url')}
          style={styles.input}
          mode="outlined"
          textColor="#fff"
          outlineColor="#444"
          activeOutlineColor={theme.colors.primary}
          keyboardType="url"
        />

        <TextInput
          label="Source Name"
          value={formData.source_name}
          onChangeText={handleChange('source_name')}
          style={styles.input}
          mode="outlined"
          textColor="#fff"
          outlineColor="#444"
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="Source Language"
          value={formData.source_language}
          onChangeText={handleChange('source_language')}
          style={styles.input}
          mode="outlined"
          textColor="#fff"
          outlineColor="#444"
          activeOutlineColor={theme.colors.primary}
        />

        <Button 
          mode="contained" 
          style={styles.button}
          buttonColor={theme.colors.primary}
          onPress={handleSubmit}
          disabled={createNovel.isPending}
        >
          {createNovel.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            'Add Novel'
          )}
        </Button>

        {createNovel.isError && (
          <Text style={styles.errorText}>
            Error: {createNovel.error instanceof Error ? createNovel.error.message : 'Failed to create novel'}
          </Text>
        )}
      </ScrollView>
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
    padding: 20,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#333',
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ff4444',
    marginTop: 16,
    textAlign: 'center',
  }
});

export default AddContentScreen; 