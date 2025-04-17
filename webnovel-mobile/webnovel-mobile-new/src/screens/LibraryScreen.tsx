import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, FAB, ActivityIndicator, useTheme } from 'react-native-paper';
import { useNovels } from '../api/contentApi';
import { Novel } from '../api/contentApi';

const LibraryScreen = ({ navigation }: { navigation: any }) => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { data: novels, isLoading, error, refetch } = useNovels();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderNovelItem = ({ item }: { item: Novel }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('NovelDetails', { novelId: item._id })}
    >
      <Card.Cover source={{ uri: item.cover_image_url || 'https://via.placeholder.com/150' }} />
      <Card.Content>
        <Text variant="titleMedium">{item.title}</Text>
        <Text variant="bodyMedium">{item.author || 'Unknown Author'}</Text>
        <Text variant="bodySmall">
          {item.read_chapters}/{item.total_chapters} chapters read
        </Text>
        <Text variant="bodySmall">
          {item.downloaded_chapters} chapters downloaded
        </Text>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error loading novels: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={novels}
        renderItem={renderNovelItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('AddNovel')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default LibraryScreen; 