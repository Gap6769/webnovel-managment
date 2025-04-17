import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, useTheme, IconButton, Menu } from 'react-native-paper';
import { useNovel, useChapters, useDeleteNovel } from '../api/contentApi';
import { useNavigation, useRoute } from '@react-navigation/native';

const NovelDetailsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { novelId } = route.params as { novelId: string };
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: novel, isLoading: novelLoading, error: novelError, refetch: refetchNovel } = useNovel(novelId);
  const { data: chapters, isLoading: chaptersLoading, error: chaptersError, refetch: refetchChapters } = useChapters(novelId);
  const { mutate: deleteNovel } = useDeleteNovel();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchNovel(), refetchChapters()]);
    setRefreshing(false);
  };

  const handleDelete = () => {
    deleteNovel(novelId, {
      onSuccess: () => {
        navigation.goBack();
      },
    });
  };

  if (novelLoading || chaptersLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (novelError || chaptersError) {
    return (
      <View style={styles.centered}>
        <Text>Error loading novel details: {novelError?.message || chaptersError?.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.card}>
          <Card.Cover source={{ uri: novel?.cover_image_url || 'https://via.placeholder.com/150' }} />
          <Card.Content>
            <Text variant="headlineMedium">{novel?.title}</Text>
            <Text variant="titleMedium">{novel?.author || 'Unknown Author'}</Text>
            <Text variant="bodyMedium">{novel?.description || 'No description available'}</Text>
            <View style={styles.statsContainer}>
              <Text variant="bodySmall">Total Chapters: {novel?.total_chapters}</Text>
              <Text variant="bodySmall">Read: {novel?.read_chapters}</Text>
              <Text variant="bodySmall">Downloaded: {novel?.downloaded_chapters}</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.chaptersContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Chapters</Text>
          {chapters?.chapters.map((chapter) => (
            <Card
              key={chapter.chapter_number}
              style={styles.chapterCard}
              onPress={() => navigation.navigate('Reader', { novelId, chapterNumber: chapter.chapter_number })}
            >
              <Card.Content>
                <Text variant="titleSmall">Chapter {chapter.chapter_number}</Text>
                <Text variant="bodyMedium">{chapter.title}</Text>
                <View style={styles.chapterStatus}>
                  {chapter.read && <Text style={styles.statusText}>Read</Text>}
                  {chapter.downloaded && <Text style={styles.statusText}>Downloaded</Text>}
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Reader', { novelId, chapterNumber: 1 })}
          style={styles.readButton}
        >
          Start Reading
        </Button>
      </View>

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
          />
        }
      >
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('EditNovel', { novelId });
          }}
          title="Edit"
        />
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            handleDelete();
          }}
          title="Delete"
        />
      </Menu>
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
  card: {
    margin: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chaptersContainer: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  chapterCard: {
    marginBottom: 8,
  },
  chapterStatus: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  readButton: {
    marginBottom: 16,
  },
  menuButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});

export default NovelDetailsScreen; 