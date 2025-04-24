import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ImageBackground, Animated, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, ActivityIndicator, useTheme, Chip, Surface, Searchbar } from 'react-native-paper';
import { useNovels } from '../api/contentApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, BookOpen, Filter, Search, Settings } from 'lucide-react-native';

// Fix type import
interface Novel {
  _id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
  read_chapters: number;
  total_chapters: number;
  downloaded_chapters: number;
  type: 'novel' | 'manhwa';
  last_updated?: string;
  status?: string;
}

const AnimatedCard = ({ item, index, navigation }: { item: Novel; index: number; navigation: any }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 70,
        useNativeDriver: true,
      })
    ]).start();
  }, [index]);
  
  // Calculate read progress percentage
  const progress = item.total_chapters ? Math.round((item.read_chapters / item.total_chapters) * 100) : 0;
  
  return (
    <Animated.View style={[{
      opacity,
      transform: [{ translateY }, { scale }],
      flex: 1,
    }, styles.cardContainer]}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={() => navigation.navigate('NovelDetails', { novelId: item._id })}
      >
        <View style={styles.cardContent}>
          <ImageBackground
            source={{ uri: item.cover_image_url || 'https://via.placeholder.com/150' }}
            style={styles.cardImage}
            imageStyle={styles.cardImageStyle}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
            />
            
            <View style={styles.typeIndicator}>
              <View 
                style={[
                  styles.typeIndicatorDot, 
                  item.type === 'novel' ? styles.novelIndicator : styles.manhwaIndicator
                ]} 
              />
            </View>
            
            {item.downloaded_chapters > 0 && (
              <View style={styles.downloadIndicator}>
                <View style={styles.downloadBadge}>
                  <Text style={styles.downloadBadgeText}>{item.downloaded_chapters}</Text>
                </View>
              </View>
            )}
          </ImageBackground>
          
          <View style={styles.cardDetails}>
            <Text variant="titleMedium" style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <View style={styles.authorContainer}>
              <Text variant="bodyMedium" style={styles.author} numberOfLines={1}>
                {item.author || 'Unknown Author'}
              </Text>
              <Text variant="bodyMedium" style={styles.author} numberOfLines={1}>
                {item.total_chapters}
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const FilterChip = ({ label, active, icon, onPress }: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}) => (
  <TouchableOpacity 
    style={[styles.filterChip, active && styles.activeFilterChip]} 
    onPress={onPress}
  >
    {icon}
    <Text style={[styles.filterChipText, active && styles.activeFilterChipText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const LibraryScreen = ({ navigation }: { navigation: any }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'novel', 'manhwa'
  const { data: novels, isLoading, error, refetch } = useNovels();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  // Filter and search novels
  const filteredNovels = useMemo(() => {
    if (!novels) return [];
    
    return novels.filter((novel: Novel) => {
      // Apply type filter
      const typeMatch = filter === 'all' || novel.type === filter;
      
      // Apply search filter if search query exists
      const searchMatch = !searchQuery || 
        novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (novel.author && novel.author.toLowerCase().includes(searchQuery.toLowerCase()));
        
      return typeMatch && searchMatch;
    });
  }, [novels, filter, searchQuery]);
  
  const renderNovelItem = ({ item, index }: { item: Novel; index: number }) => (
    <AnimatedCard item={item} index={index} navigation={navigation} />
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#1a1a1a' }]}>
        <ActivityIndicator size="large" color="#9575cd" />
        <Text style={styles.loadingText}>Loading your novels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: '#1a1a1a' }]}>
        <Text style={styles.errorText}>Error loading novels</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <Surface style={styles.retrySurface}>
          <Text style={styles.retryText} onPress={() => refetch()}>
            Tap to retry
          </Text>
        </Surface>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: '#1a1a1a', 
          paddingTop: insets.top,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {showSearch ? (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search titles or authors..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#9575cd"
            placeholderTextColor="#757575"
            onIconPress={() => {
              if (searchQuery === '') {
                setShowSearch(false);
              } else {
                setSearchQuery('');
              }
            }}
            icon={searchQuery === '' ? 'arrow-left' : 'close'}
          />
        </View>
      ) : (
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Text variant="headlineMedium" style={styles.header}>My Library</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setShowSearch(true)}
              >
                <Search size={22} color="#9575cd" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Settings size={22} color="#9575cd" />
              </TouchableOpacity>
            </View>
          </View>
          <Text variant="bodyMedium" style={styles.subheader}>
            {filteredNovels.length} {filter !== 'all' ? filter + 's' : 'items'} in your collection
          </Text>
        </View>
      )}
      
      <View style={styles.filterContainer}>
        <FilterChip 
          label="All" 
          active={filter === 'all'} 
          icon={<Filter size={16} color={filter === 'all' ? '#fff' : '#9e9e9e'} />}
          onPress={() => setFilter('all')} 
        />
        <FilterChip 
          label="Novels" 
          active={filter === 'novel'} 
          icon={<Book size={16} color={filter === 'novel' ? '#fff' : '#9e9e9e'} />}
          onPress={() => setFilter('novel')} 
        />
        <FilterChip 
          label="Manhwa" 
          active={filter === 'manhwa'} 
          icon={<BookOpen size={16} color={filter === 'manhwa' ? '#fff' : '#9e9e9e'} />}
          onPress={() => setFilter('manhwa')} 
        />
      </View>
      
      {filteredNovels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Add some content to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNovels}
          renderItem={renderNovelItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#9575cd']}
              tintColor="#9575cd"
              progressBackgroundColor="#333"
            />
          }
        />
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={() => navigation.navigate('AddContent')}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(149, 117, 205, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  subheader: {
    color: '#9e9e9e',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    elevation: 0,
  },
  searchInput: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#9575cd',
  },
  filterChipText: {
    color: '#9e9e9e',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#9e9e9e',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ef5350',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#9e9e9e',
    textAlign: 'center',
    marginBottom: 20,
  },
  retrySurface: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    elevation: 2,
  },
  retryText: {
    color: '#9575cd',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9e9e9e',
  },
  list: {
    padding: 8,
    paddingBottom: 80,
  },
  cardContainer: {
    width: '50%',
    padding: 6,
  },
  cardTouchable: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  cardImage: {
    height: 200,
    width: '100%',
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  typeIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  typeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  novelIndicator: {
    backgroundColor: '#9575cd',
  },
  manhwaIndicator: {
    backgroundColor: '#42a5f5',
  },
  downloadIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  downloadBadge: {
    backgroundColor: 'rgba(33, 33, 33, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  downloadBadgeText: {
    color: '#ff9800',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDetails: {
    padding: 12,
    backgroundColor: '#2d2d2d',
  },
  authorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  author: {
    color: '#9e9e9e',
    marginBottom: 8,
    fontSize: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#424242',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9575cd',
    borderRadius: 1.5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: '#9575cd',
  },
});

export default LibraryScreen;