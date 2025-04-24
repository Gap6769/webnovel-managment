import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, useTheme, ActivityIndicator, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNovel, useUpdateNovel, useSources } from '../api/contentApi';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  EditNovel: { novelId: string };
};

type EditNovelScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditNovel'>;

const EditNovelScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const navigation = useNavigation<EditNovelScreenNavigationProp>();
  const route = useRoute();
  const { novelId } = route.params as { novelId: string };
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [sourceMenuVisible, setSourceMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  const { data: novel, isLoading: novelLoading } = useNovel(novelId);
  const { data: sources, isLoading: sourcesLoading } = useSources();
  const updateNovel = useUpdateNovel();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    cover_image_url: '',
    status: 'Ongoing',
    type: 'novel' as 'novel' | 'manhwa',
    source_language: '',
    source_name: '',
    source_url: '',
    description: '',
  });

  useEffect(() => {
    if (novel) {
      setFormData({
        title: novel.title || '',
        author: novel.author || '',
        cover_image_url: novel.cover_image_url || '',
        status: novel.status || 'Ongoing',
        type: novel.type || 'novel',
        source_language: novel.source_language || '',
        source_name: novel.source_name || '',
        source_url: novel.source_url || '',
        description: novel.description || '',
      });
    }
  }, [novel]);

  const handleSubmit = async () => {
    try {
      await updateNovel.mutateAsync({ id: novelId, ...formData });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating novel:', error);
    }
  };

  const handleChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const typeLabels = {
    novel: 'Novela',
    manhwa: 'Manhwa'
  };

  const statusOptions = ['Ongoing', 'Completed', 'Hiatus', 'Dropped'];
  const filteredSources = sources?.filter(source => source.content_type === formData.type) || [];

  if (novelLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#2a2a2a' }]}>
        <ActivityIndicator size="large" color="#ccc" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: '#2a2a2a' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Button 
          icon="arrow-left" 
          mode="text" 
          onPress={() => navigation.goBack()}
          textColor="#fff"
        >
          Back
        </Button>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineMedium" style={styles.title}>Edit Novel</Text>
        
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
          label="Author"
          value={formData.author}
          onChangeText={handleChange('author')}
          style={styles.input}
          mode="outlined"
          textColor="#fff"
          outlineColor="#444"
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="Cover Image URL"
          value={formData.cover_image_url}
          onChangeText={handleChange('cover_image_url')}
          style={styles.input}
          mode="outlined"
          textColor="#fff"
          outlineColor="#444"
          activeOutlineColor={theme.colors.primary}
          keyboardType="url"
        />

        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setStatusMenuVisible(true)}
              style={styles.typeButton}
              textColor="#fff"
              icon="chevron-down"
            >
              Status: {formData.status}
            </Button>
          }
        >
          {statusOptions.map(status => (
            <Menu.Item 
              key={status}
              onPress={() => {
                setFormData(prev => ({ ...prev, status }));
                setStatusMenuVisible(false);
              }} 
              title={status} 
            />
          ))}
        </Menu>

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
          label="Description"
          value={formData.description}
          onChangeText={handleChange('description')}
          style={styles.descriptionInput}
          mode="outlined"
          textColor="#fff"
          outlineColor="#444"
          activeOutlineColor={theme.colors.primary}
          multiline
          numberOfLines={8}
          scrollEnabled={false}
        />

        <Button 
          mode="contained" 
          style={styles.button}
          buttonColor={theme.colors.primary}
          onPress={handleSubmit}
          disabled={updateNovel.isPending}
        >
          {updateNovel.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            'Save Changes'
          )}
        </Button>

        {updateNovel.isError && (
          <Text style={styles.errorText}>
            Error: {updateNovel.error instanceof Error ? updateNovel.error.message : 'Failed to update novel'}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  descriptionInput: {
    marginBottom: 16,
    backgroundColor: '#333',
    minHeight: 150,
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

export default EditNovelScreen; 