import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  useWindowDimensions, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  Platform,
  TouchableWithoutFeedback,
  Pressable,
  Linking,
  
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, IconButton, ActivityIndicator, useTheme, Menu, ProgressBar, Snackbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useChapter, useNovel } from '../api/contentApi';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingOverlay from '../components/LoadingOverlay';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  /Support for defaultProps will be removed/,
]);

type RootStackParamList = {
  Reader: { novelId: string; chapterNumber: number };
};

type ReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reader'>;

const ReaderScreen = ({
  novelId = '',
  chapterNumber = 1
}: {
  novelId?: string;
  chapterNumber?: number;
}) => {
  const theme = useTheme();
  const navigation = useNavigation<ReaderScreenNavigationProp>();
  const route = useRoute();
  const { novelId: routeNovelId, chapterNumber: routeChapterNumber } = route.params as { novelId: string; chapterNumber: number };
  const currentNovelId = routeNovelId || novelId;
  const currentChapterNumber = routeChapterNumber || chapterNumber;
  const [fontSize, setFontSize] = useState(30);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [imageRatios, setImageRatios] = useState<{ [key: number]: number }>({});
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: chapter, isLoading: chapterLoading, error: chapterError } = useChapter(currentNovelId, currentChapterNumber);
  const { data: novel, isLoading: novelLoading } = useNovel(currentNovelId);
  const isLoading = chapterLoading || novelLoading;
  const isManhwa = novel?.type === 'manhwa';

  const renderersProps = useMemo(() => ({
    a: {
      onPress: (_: unknown, href: string) => {
        if (href) {
          Linking.openURL(href);
        }
      }
    }
  }), []);

  // Handle font size changes
  const handleFontSizeChange = (newSize: number) => {
    setFontSize(Math.max(20, Math.min(40, newSize)));
    showSnackbar(`Font size: ${newSize}`);
  };

  // Handle scroll events with improved performance
  const handleScroll = useCallback((event: any) => {
    const { y } = event.nativeEvent.contentOffset;
    setScrollPosition(y);
  }, []);

  // Calculate reading progress with improved accuracy
  const calculateReadingProgress = useCallback(() => {
    if (contentHeight <= 0) return 0;
    const windowHeight = Dimensions.get('window').height;
    const maxScrollPosition = Math.max(0, contentHeight - windowHeight);
    return Math.min(1, Math.max(0, scrollPosition / maxScrollPosition));
  }, [contentHeight, scrollPosition]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, [isFullscreen]);

  // Handle screen tap with double-tap detection
  const handleTap = () => {

    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      // Double tap detected
      toggleFullscreen()
      setLastTap(null);
    } else {
      // Single tap
      setLastTap(now);
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Jump to specific position in content
  const jumpToPosition = useCallback((percentage: number) => {
    if (scrollViewRef.current && contentHeight > 0) {
      const windowHeight = Dimensions.get('window').height;
      const maxScrollPosition = Math.max(0, contentHeight - windowHeight);
      const targetPosition = maxScrollPosition * percentage;
      
      scrollViewRef.current.scrollTo({ y: targetPosition, animated: true });
    }
  }, [contentHeight]);

  // HTML styles for novel content
  const tagsStyles = useMemo(() => ({
    p: {
      color: '#ccc',
      fontSize: fontSize,
      lineHeight: fontSize * 1.8,
      marginBottom: fontSize * 0.8,
      textAlign: 'left' as 'left',
      fontFamily: 'gothampro',
      letterSpacing: 0.5,
      paddingHorizontal: 0,
    },
    h1: {
      color: '#ccc',
      fontSize: fontSize * 1.4,
      marginBottom: fontSize * 1.2,
      textAlign: 'center' as 'center',
      fontFamily: 'gothampro_bold',
      letterSpacing: 0.8,
      paddingHorizontal: 0,
    },
    h2: {
      color: '#ccc',
      fontSize: fontSize * 1.2,
      marginBottom: fontSize * 1,
      textAlign: 'center' as 'center',
      fontFamily: 'gothampro_medium',
      letterSpacing: 0.6,
      paddingHorizontal: 0,
    },
    em: {
      fontStyle: 'italic' as 'italic',
      color: '#ccc',
    },
    strong: {
      fontWeight: 'bold' as 'bold',
      color: '#ccc',
    },
  }), [fontSize]);

  const baseStyle = useMemo(() => ({
    color: '#ccc',
    fontSize: fontSize,
    lineHeight: fontSize * 1.8,
    fontFamily: 'gothampro',
    letterSpacing: 0.5,
    paddingHorizontal: 1,
  }), [fontSize]);

  const renderHtmlSource = useMemo(() => {
    return chapter?.content ? { html: chapter.content } : { html: '' };
  }, [chapter?.content]);

  const contentWidth = width - 40;

  // Load image dimensions for manhwa content
  useEffect(() => {
    if (chapter?.type === 'manhwa' && chapter.images?.length) {
      chapter.images.forEach((img, idx) => {
        Image.getSize(img.url, (w, h) => {
          setImageRatios((prev) => ({ ...prev, [idx]: w / h }));
        }, (error) => console.log('Image load error:', error));
      });
    }
  }, [chapter?.images]);

  // Handle status bar visibility
  useEffect(() => {
    if (isFullscreen) {
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
    
    return () => {
      StatusBar.setHidden(false);
    };
  }, [isFullscreen]);

  // Navigation component
  const NavigationButtons = ({ showChapterIndicator = false }: { showChapterIndicator?: boolean }) => {
    const handleChapterChange = (newChapterNumber: number) => {
      // Reset scroll position and progress
      setScrollPosition(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      // Navigate to new chapter
      navigation.navigate('Reader', { novelId: currentNovelId, chapterNumber: newChapterNumber });
      showSnackbar(`Loading chapter ${newChapterNumber}`);
    };

    return (
      <View style={[
        styles.navigationButtons,
        { backgroundColor: isFullscreen ? 'rgba(42, 42, 42, 0.8)' : '#2a2a2a' }
      ]}>
        <IconButton 
          icon="chevron-left" 
          size={24} 
          onPress={() => {
            if (currentChapterNumber > 1) {
              handleChapterChange(currentChapterNumber - 1);
            }
          }} 
          disabled={currentChapterNumber <= 1} 
          iconColor="#ccc" 
        />
        {showChapterIndicator && (
          <Text style={styles.pageIndicator}>
            {`Chapter ${currentChapterNumber}`}
          </Text>
        )}
        <IconButton 
          icon="chevron-right" 
          size={24} 
          onPress={() => handleChapterChange(currentChapterNumber + 1)} 
          iconColor="#ccc" 
        />
      </View>
    );
  };

  // Render novel content
  const renderNovelContent = () => (
    <View>
      <RenderHtml
        contentWidth={contentWidth}
        source={renderHtmlSource}
        tagsStyles={tagsStyles}
        baseStyle={baseStyle}
        enableExperimentalMarginCollapsing={true}
        defaultTextProps={{ selectable: true }}
        defaultViewProps={{ testID: 'html-content' }}
        defaultWebViewProps={{ testID: 'webview-content' }}
        renderersProps={renderersProps}
        WebView={WebView}
        debug={false}
      />
      {!isManhwa && <NavigationButtons showChapterIndicator={true} />}
    </View>
  );

  // Render manhwa content
  const renderManhwaContent = () => (
    <View style={styles.imagesContainer}>
      {chapter?.images?.map((image, index) => {
        const ratio = imageRatios[index] || 1;
        return (
          <View key={index} style={styles.imageWrapper}>
            <Image
              source={{ uri: image.url }}
              style={{ width: width, aspectRatio: ratio }}
              resizeMode="contain"
            />
          </View>
        );
      })}
      {chapter?.images && chapter.images.length > 0 && (
        <NavigationButtons showChapterIndicator={true} />
      )}
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#3b3a3a' }]}>
        <LoadingOverlay visible={true} message="Loading chapter..." />
      </View>
    );
  }

  // Error state
  if (chapterError) {
    return (
      <View style={[styles.centered, { backgroundColor: '#3b3a3a' }]}>
        <Text style={{ color: '#ff4444' }}>Error loading chapter: {chapterError.message}</Text>
      </View>
    );
  }

  const progress = calculateReadingProgress();
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={[styles.container, { backgroundColor: '#3b3a3a' }]}>
      {/* Header - only visible in normal mode */}
      {!isFullscreen && (
        <View 
          style={[
            styles.header, 
            { 
              backgroundColor: '#2a2a2a', 
              paddingTop: insets.top 
            }
          ]}
        >
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => navigation.goBack()} 
            iconColor="#ccc" 
          />
          <Text variant="titleMedium" style={[styles.title, { color: '#ccc' }]}>
            {chapter?.title || `Chapter ${currentChapterNumber}`}
          </Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton 
                icon="dots-vertical" 
                size={24} 
                onPress={() => setMenuVisible(true)} 
                iconColor="#ccc" 
              />
            }
          >
            {!isManhwa && (
              <>
                <Menu.Item 
                  onPress={() => { 
                    setMenuVisible(false); 
                    handleFontSizeChange(fontSize + 2); 
                  }} 
                  title="Increase Font Size" 
                  leadingIcon="format-font-size-increase"
                />
                <Menu.Item 
                  onPress={() => { 
                    setMenuVisible(false); 
                    handleFontSizeChange(fontSize - 2); 
                  }} 
                  title="Decrease Font Size" 
                  leadingIcon="format-font-size-decrease"
                />
              </>
            )}
            <Menu.Item 
              onPress={() => { 
                setMenuVisible(false); 
                toggleFullscreen(); 
              }} 
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} 
              leadingIcon={isFullscreen ? "fullscreen-exit" : "fullscreen"}
            />
            <Menu.Item 
              onPress={() => { 
                setMenuVisible(false);
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ y: 0, animated: true });
                }
              }} 
              title="Back to Top" 
              leadingIcon="arrow-up"
            />
            <Menu.Item 
              onPress={() => { 
                setMenuVisible(false);
                showSnackbar("Double-tap to exit fullscreen mode");
              }} 
              title="Help" 
              leadingIcon="help-circle"
            />
          </Menu>
        </View>
      )}
      
      {/* Progress bar - normal mode */}
      {!isFullscreen && (
        <View style={styles.normalProgressContainer}>
          <ProgressBar 
            progress={progress} 
            color="#ccc" 
            style={styles.normalProgressBar}
          />
        </View>
      )}
      
      {/* Progress bar - fullscreen mode */}
      {isFullscreen && (
        <View style={styles.fullscreenProgressContainer}>
          <View style={styles.fullscreenProgressWrapper}>
            <View style={styles.fullscreenProgressBarContainer}>
              <View 
                style={[
                  styles.fullscreenProgressBar,
                  { width: `${progressPercent}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      )}
      
      {/* Fullscreen header */}
      
      {/* Main content */}
      <ScrollView 
        ref={scrollViewRef}
        style={[
          styles.content,
          isFullscreen && styles.fullscreenContent
        ]}
        contentContainerStyle={[
          styles.contentContainer,
          isManhwa && styles.manhwaContentContainer
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(w, h) => setContentHeight(h)}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        <Pressable 
          onPress={handleTap}
          style={styles.contentWrapper}
        >
          {isManhwa ? renderManhwaContent() : renderNovelContent()}
        </Pressable>
      </ScrollView>
      
      
      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        <Text style={{ color: '#fff' }}>{snackbarMessage}</Text>
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    position: 'relative'
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 1
  },
  content: { 
    flex: 1,
    backgroundColor: '#000'
  },
  contentContainer: { 
    width: '100%',
    padding: 20,
    flexGrow: 1
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    zIndex: 10,
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1001,
  },
  fullscreenTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  title: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 20 
  },
  manhwaContentContainer: {
    padding: 0,
  },
  normalProgressContainer: {
    backgroundColor: '#2a2a2a',
    paddingBottom: 8,
    paddingHorizontal: 20,
    zIndex: 5,
  },
  normalProgressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullscreenProgressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',

    marginHorizontal: 50,
    alignSelf: "center"
  },
  fullscreenProgressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  fullscreenProgressBarContainer: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullscreenProgressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  fullscreenProgressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  fullscreenContent: {
    paddingTop: 40, // Space for the header
  },
  floatingFullscreenButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  fullscreenIcon: { 
    margin: 0 
  },
  imagesContainer: { 
    width: '100%' 
  },
  imageWrapper: { 
    width: '100%', 
    marginVertical: 0 
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    marginTop: 30,
    marginBottom: 30,
    borderRadius: 8,
  },
  pageIndicator: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
  },
}); 

export default ReaderScreen;