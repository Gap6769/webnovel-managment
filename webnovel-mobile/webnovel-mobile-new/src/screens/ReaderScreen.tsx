import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, IconButton, ActivityIndicator, useTheme, Menu } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useChapter, useUpdateReadingProgress } from '../api/contentApi';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';

type RootStackParamList = {
  Reader: { novelId: string; chapterNumber: number };
};

type ReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reader'>;

const ReaderScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ReaderScreenNavigationProp>();
  const route = useRoute();
  const { novelId, chapterNumber } = route.params as { novelId: string; chapterNumber: number };
  const [fontSize, setFontSize] = useState(24);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: chapter, isLoading, error } = useChapter(novelId, chapterNumber);
  const { mutate: updateProgress } = useUpdateReadingProgress();

  useEffect(() => {
    if (chapter) {
      updateProgress({ novelId, chapterNumber });
    }
  }, [chapter, chapterNumber, novelId, updateProgress]);

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(Math.max(24, Math.min(40, newSize)));
  };

  const tagsStyles = {
    p: {
      color: theme.colors.onSurface,
      fontSize: fontSize,
      lineHeight: fontSize * 1.6,
      marginBottom: fontSize * 0.6,
      textAlign: 'justify' as 'justify',
      fontFamily: 'gothampro',
      letterSpacing: 0.2,
    },
    h1: {
      color: theme.colors.onSurface,
      fontSize: fontSize * 1.4,
      marginBottom: fontSize * 0.8,
      textAlign: 'center' as 'center',
      fontFamily: 'gothampro_bold',
    },
    h2: {
      color: theme.colors.onSurface,
      fontSize: fontSize * 1.2,
      marginBottom: fontSize * 0.6,
      textAlign: 'center' as 'center',
      fontFamily: 'gothampro_medium',
    },
  };

  const baseStyle = {
    color: theme.colors.onSurface,
    fontSize: fontSize,
    lineHeight: fontSize * 1.6,
    fontFamily: 'gothampro',
    letterSpacing: 0.2,
    paddingHorizontal: 20,
  };

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
        <Text>Error loading chapter: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen]}>
      {!isFullscreen && (
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleMedium" style={styles.title}>
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
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleFontSizeChange(fontSize + 4);
              }}
              title="Increase Font Size"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleFontSizeChange(fontSize - 4);
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
      >
        {chapter?.content && (
          <RenderHtml
            contentWidth={Dimensions.get('window').width - 32}
            source={{ html: chapter.content }}
            tagsStyles={tagsStyles}
            baseStyle={baseStyle}
          />
        )}
      </ScrollView>

      {!isFullscreen && (
        <View style={styles.footer}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={() => navigation.navigate('Reader', { novelId, chapterNumber: chapterNumber - 1 })}
            disabled={chapterNumber <= 1}
          />
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => navigation.navigate('Reader', { novelId, chapterNumber: chapterNumber + 1 })}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b3a3a',
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
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
    color: '#ccc',
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
});

export default ReaderScreen; 