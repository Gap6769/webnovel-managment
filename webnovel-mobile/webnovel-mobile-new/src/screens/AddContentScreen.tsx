import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput, useTheme, ActivityIndicator, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateNovel, useSources } from '../api/contentApi';

const AddContentScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [sourceMenuVisible, setSourceMenuVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    source_url: '',
    source_name: '',
    source_language: '',
    type: 'novel' as 'novel' | 'manhwa'
  });

  const createNovel = useCreateNovel();
  const { data: sources, isLoading: sourcesLoading } = useSources();

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

  const typeLabels = {
    novel: 'Novela',
    manhwa: 'Manhwa'
  };

  const filteredSources = sources?.filter(source => source.content_type === formData.type) || [];

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
        <Text variant="headlineMedium" style={styles.title}>Add New Content</Text>
        
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

        <Menu
          visible={typeMenuVisible}
          onDismiss={() => setTypeMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setTypeMenuVisible(true)}
              style={styles.typeButton}
              textColor="#fff"
              icon="chevron-down"
            >
              Type: {typeLabels[formData.type]}
            </Button>
          }
        >
          <Menu.Item 
            onPress={() => {
              setFormData(prev => ({ ...prev, type: 'novel' }));
              setTypeMenuVisible(false);
            }} 
            title="Novela" 
          />
          <Menu.Item 
            onPress={() => {
              setFormData(prev => ({ ...prev, type: 'manhwa' }));
              setTypeMenuVisible(false);
            }} 
            title="Manhwa" 
          />
        </Menu>

        <Menu
          visible={sourceMenuVisible}
          onDismiss={() => setSourceMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSourceMenuVisible(true)}
              style={styles.typeButton}
              textColor="#fff"
              icon="chevron-down"
              disabled={sourcesLoading || !filteredSources.length}
            >
              {sourcesLoading ? 'Loading sources...' : 
               !filteredSources.length ? 'No sources available' :
               `Source: ${formData.source_name || 'Select a source'}`}
            </Button>
          }
        >
          {filteredSources.map(source => (
            <Menu.Item 
              key={source._id}
              onPress={() => {
                setFormData(prev => ({ 
                  ...prev, 
                  source_name: source.name,
                  source_language: source.language || 'en'
                }));
                setSourceMenuVisible(false);
              }} 
              title={source.name} 
            />
          ))}
        </Menu>

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
            'Add Content'
          )}
        </Button>

        {createNovel.isError && (
          <Text style={styles.errorText}>
            Error: {createNovel.error instanceof Error ? createNovel.error.message : 'Failed to create content'}
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
  typeButton: {
    marginBottom: 16,
    borderColor: '#444',
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