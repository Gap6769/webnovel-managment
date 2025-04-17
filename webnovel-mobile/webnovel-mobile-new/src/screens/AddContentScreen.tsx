import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useCreateNovel } from '../api/contentApi';

const AddContentScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const createNovel = useCreateNovel();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    sourceUrl: '',
    description: '',
  });

  const handleSubmit = async () => {
    try {
      await createNovel.mutateAsync(formData);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add novel. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <TextInput
          label="Title"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          style={styles.input}
        />

        <TextInput
          label="Author"
          value={formData.author}
          onChangeText={(text) => setFormData({ ...formData, author: text })}
          style={styles.input}
        />

        <TextInput
          label="Source URL"
          value={formData.sourceUrl}
          onChangeText={(text) => setFormData({ ...formData, sourceUrl: text })}
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          style={styles.input}
          multiline
          numberOfLines={4}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={createNovel.isPending}
        >
          Add Novel
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

export default AddContentScreen; 