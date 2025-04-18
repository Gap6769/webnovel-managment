import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Text, IconButton, ActivityIndicator, useTheme, Menu, ProgressBar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useChapter, useUpdateReadingProgress } from '../api/contentApi';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RootStackParamList = {
  Reader: { novelId: string; chapterNumber: number };
};

type ReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reader'>;

const ReaderScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ReaderScreenNavigationProp>();
  const route = useRoute();
  const { novelId, chapterNumber } = route.params as { novelId: string; chapterNumber: number };
  const [fontSize, setFontSize] = useState(30);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { data: chapter, isLoading, error } = useChapter(novelId, chapterNumber);
  const { mutate: updateProgress } = useUpdateReadingProgress();

  useEffect(() => {
    if (chapter) {
      updateProgress({ novelId, chapterNumber });
    }
  }, [chapter, chapterNumber, novelId, updateProgress]);

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(Math.max(20, Math.min(40, newSize)));
  };

  const handleScroll = useCallback((event: any) => {
    const { y } = event.nativeEvent.contentOffset;
    setScrollPosition(y);
  }, []);

  const calculateReadingProgress = useCallback(() => {
    if (contentHeight === 0) return 0;
    return Math.min(1, scrollPosition / contentHeight);
  }, [contentHeight, scrollPosition]);

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

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#3b3a3a' }]}>
        <ActivityIndicator size="large" color="#ccc" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: '#3b3a3a' }]}>
        <Text style={{ color: '#ff4444' }}>Error loading chapter: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#3b3a3a' }]}>
      {!isFullscreen && (
        <View style={[styles.header, { backgroundColor: '#2a2a2a', paddingTop: insets.top }]}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor="#ccc"
          />
          <Text variant="titleMedium" style={[styles.title, { color: '#ccc' }]}>
            {chapter?.chapter_title || `Chapter ${chapterNumber}`}
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
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleFontSizeChange(fontSize + 2);
              }}
              title="Increase Font Size"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleFontSizeChange(fontSize - 2);
              }}
              title="Decrease Font Size"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setIsFullscreen(!isFullscreen);
              }}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            />
          </Menu>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        onContentSizeChange={(w, h) => setContentHeight(h)}
      >
        {chapter?.content && (
          <RenderHtml
            contentWidth={contentWidth}
            source={renderHtmlSource}
            tagsStyles={tagsStyles}
            baseStyle={baseStyle}
            enableExperimentalMarginCollapsing={true}
          />
        )}
      </ScrollView>

      {isFullscreen && (
        <TouchableOpacity
          style={[
            styles.fullscreenButton,
            { top: insets.top }
          ]}
          onPress={() => setIsFullscreen(false)}
          activeOpacity={0.8}
        >
          <View style={styles.fullscreenButtonContent}>
            <IconButton
              icon="fullscreen-exit"
              size={20}
              iconColor="#fff"
              style={styles.fullscreenIcon}
            />
          </View>
        </TouchableOpacity>
      )}

      {!isFullscreen && (
        <>
          <ProgressBar
            progress={calculateReadingProgress()}
            color="#ccc"
            style={styles.progressBar}
          />
          <View style={[styles.footer, { backgroundColor: '#2a2a2a', paddingBottom: insets.bottom }]}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={() => navigation.navigate('Reader', { novelId, chapterNumber: chapterNumber - 1 })}
              disabled={chapterNumber <= 1}
              iconColor="#ccc"
            />
            <Text style={{ color: '#ccc' }}>
              {Math.round(calculateReadingProgress() * 100)}%
            </Text>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => navigation.navigate('Reader', { novelId, chapterNumber: chapterNumber + 1 })}
              iconColor="#ccc"
            />
          </View>
        </>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
    maxWidth: 700,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  progressBar: {
    height: 2,
    backgroundColor: 'transparent',
  },
  fullscreenButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullscreenButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenIcon: {
    margin: 0,
  },
});

export default ReaderScreen; 