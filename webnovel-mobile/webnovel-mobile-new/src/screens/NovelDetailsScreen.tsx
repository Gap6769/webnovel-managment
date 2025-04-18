import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ImageBackground, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Button, ActivityIndicator, IconButton, Menu, Chip, Divider, Badge, Portal, Snackbar, Modal } from 'react-native-paper';
import { useNovel, useChapters, useDeleteNovel, useFetchChapters } from '../api/contentApi';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Download } from 'lucide-react-native';
import LoadingOverlay from '../components/LoadingOverlay';

interface Chapter {
  chapter_number: number;
  title: string;
  read: boolean;
  downloaded: boolean;
}

type RootStackParamList = {
  Reader: { novelId: string; chapterNumber: number };
  EditNovel: { novelId: string };
  NovelDetails: { novelId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NovelDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { novelId } = route.params as { novelId: string };
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const { mutate: deleteNovel, isPending: isDeleting } = useDeleteNovel();
  const { mutate: fetchChapters, isPending: isUpdating } = useFetchChapters();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { data: novel, isLoading: novelLoading, error: novelError, refetch: refetchNovel } = useNovel(novelId);
  const { data: chapters, isLoading: chaptersLoading, error: chaptersError, refetch: refetchChapters } = useChapters(novelId);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchNovel(), refetchChapters()]);
    setRefreshing(false);
  };

  const handleUpdateChapters = () => {
    setMenuVisible(false);
    fetchChapters(novelId, {
      onSuccess: () => {
        setSnackbarMessage('Chapters updated successfully');
        setShowSnackbar(true);
        refetchNovel();
        refetchChapters();
      },
      onError: () => {
        setSnackbarMessage('Error updating chapters');
        setShowSnackbar(true);
      }
    });
  };

  const handleDelete = () => {
    setMenuVisible(false);
    deleteNovel(novelId, {
      onSuccess: () => {
        navigation.goBack();
      },
      onError: () => {
        setSnackbarMessage('Error deleting novel');
        setShowSnackbar(true);
      }
    });
  };

  // Calculate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Function to show menu and set its position
  const showMenu = (event: any) => {
    // Get width from Dimensions
    const { width } = Dimensions.get('window');
    setMenuPosition({ 
      x: width - 170, // Position from right side with some padding
      y: insets.top + 70 // Position below the top insets with some spacing
    });
    setMenuVisible(true);
  };

  if (novelLoading || chaptersLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#2a2a2a' }]}>
        <ActivityIndicator size="large" color="#ccc" />
      </View>
    );
  }

  if (novelError || chaptersError) {
    return (
      <View style={[styles.centered, { backgroundColor: '#2a2a2a' }]}>
        <Text style={{ color: '#ff4444' }}>Error loading novel details: {novelError?.message || chaptersError?.message}</Text>
      </View>
    );
  }

  // Calculate reading progress
  const readProgress = novel?.total_chapters ? Math.round((novel.read_chapters / novel.total_chapters) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: '#2a2a2a', paddingTop: insets.top }]}>
      {/* Animated header that appears when scrolling */}
      <Animated.View 
        style={[
          styles.animatedHeader,
          { 
            opacity: headerOpacity,
            paddingTop: insets.top,
          }
        ]}
      >
        <View style={styles.animatedHeaderContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.animatedHeaderTitle}>
            {novel?.title}
          </Text>
          <TouchableOpacity onPress={showMenu}>
            <IconButton icon="dots-vertical" size={22} iconColor="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#ccc']}
            tintColor="#ccc"
            progressBackgroundColor="#333"
          />
        }
      >
        <ImageBackground
          source={{ uri: novel?.cover_image_url || 'https://via.placeholder.com/150' }}
          style={styles.headerImage}
        >
          <LinearGradient
            colors={['transparent', 'rgba(42, 42, 42, 0.8)', '#2a2a2a']}
            style={styles.gradient}
          >
            <View style={styles.headerActions}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor="#fff"
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              />
              <IconButton
                icon="dots-vertical"
                size={24}
                onPress={showMenu}
                style={styles.backButton}
                iconColor="#fff"
              />
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>{novel?.title}</Text>
          <Text variant="titleMedium" style={styles.author}>{novel?.author || 'Unknown Author'}</Text>
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={[styles.badge, {backgroundColor: '#7c4dff'}]}>{novel?.total_chapters}</Text>
              <Text style={styles.statText}>Chapters</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.badge, {backgroundColor: '#4caf50'}]}>{novel?.read_chapters}</Text>
              <Text style={styles.statText}>Read</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.badge, {backgroundColor: '#2196f3'}]}>{novel?.downloaded_chapters}</Text>
              <Text style={styles.statText}>Downloaded</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.badge, {backgroundColor: '#ff9800'}]}>{readProgress}%</Text>
              <Text style={styles.statText}>Progress</Text>
            </View>
          </View>

          <Divider style={styles.divider} />
          
          {novel?.description && (
            <View style={styles.descriptionContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
              <Text 
                variant="bodyMedium" 
                style={styles.description}
                numberOfLines={expandedDescription ? undefined : 3}
              >
                {novel.description}
              </Text>
              {novel.description.length > 100 && (
                <TouchableOpacity 
                  style={styles.expandButton}
                  onPress={() => setExpandedDescription(!expandedDescription)}
                >
                  <Text style={styles.expandButtonText}>
                    {expandedDescription ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text variant="titleLarge" style={styles.sectionTitle}>Chapters</Text>
          <View style={styles.chaptersContainer}>
            {chapters?.chapters.map((chapter: Chapter) => (
              <Card
                key={`${novelId}-${chapter.chapter_number}-${chapter.title}`}
                style={styles.chapterCard}
                mode="outlined"
                onPress={() => navigation.navigate('Reader', { 
                  novelId, 
                  chapterNumber: chapter.chapter_number 
                })}
              >
                <Card.Content style={styles.chapterContent}>
                  <View>
                    <Text variant="titleSmall" style={styles.chapterTitle}>
                      Chapter {chapter.chapter_number}
                    </Text>
                    <Text variant="bodyMedium" style={styles.chapterSubtitle} numberOfLines={1}>
                      {chapter.title}
                    </Text>
                  </View>
                  <View style={styles.chapterStatus}>
                    {chapter.read && (
                      <View style={{
                        width: 24,
                        height: 24,
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={14} color="#fff" />
                      </View>
                      
                    )}
  
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Reader', { 
            novelId, 
            chapterNumber: novel?.read_chapters ? novel.read_chapters + 1 : 1 
          })}
          style={styles.readButton}
          buttonColor="#7c4dff"
        >
          {novel?.read_chapters > 0 ? 'Continue Reading' : 'Start Reading'}
        </Button>
      </View>

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={menuPosition}
        contentStyle={{ backgroundColor: '#3b3a3a' }}
      >
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('EditNovel', { novelId });
          }}
          title="Edit Novel"
          leadingIcon="pencil"
          titleStyle={{ color: '#fff' }}
        />
        <Menu.Item
          onPress={handleUpdateChapters}
          title={isUpdating ? "Updating..." : "Update Chapters"}
          leadingIcon={isUpdating ? "refresh" : "refresh"}
          titleStyle={{ color: '#fff' }}
          disabled={isUpdating}
        />
        <Menu.Item
          onPress={handleDelete}
          title={isDeleting ? "Deleting..." : "Delete Novel"}
          leadingIcon={isDeleting ? "delete" : "delete"}
          titleStyle={{ color: '#ff4444' }}
          disabled={isDeleting}
        />
      </Menu>

      <Portal>
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => setShowSnackbar(false)}
          duration={3000}
          style={{ backgroundColor: '#3b3a3a' }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>

      <LoadingOverlay 
        visible={isUpdating || isDeleting} 
        message={isUpdating ? "Updating chapters..." : "Deleting novel..."} 
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
  scrollView: {
    flex: 1,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2a2a2a',
    zIndex: 10,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  animatedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  animatedHeaderTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    marginHorizontal: 16,
  },
  headerImage: {
    height: 300,
    width: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-start',
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    margin: 0,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    color: '#ccc',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  badge: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
    textAlign: 'center',
  },
  statText: {
    color: '#ccc',
    fontSize: 12,
  },
  divider: {
    backgroundColor: '#444',
    height: 1,
    marginVertical: 16,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    color: '#ccc',
    lineHeight: 22,
  },
  expandButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    color: '#7c4dff',
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chaptersContainer: {
    marginBottom: 80,
  },
  chapterCard: {
    marginBottom: 8,
    backgroundColor: '#3b3a3a',
    borderColor: '#444',
  },
  chapterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chapterSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  chapterStatus: {
    flexDirection: 'row',
    gap: 8,

  },
  readChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.7)',

    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  downloadedChip: {
    backgroundColor: 'rgba(33, 150, 243, 0.7)',
    height: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#444',
    backgroundColor: '#2a2a2a',
  },
  readButton: {
    borderRadius: 8,
  },
});

export default NovelDetailsScreen;