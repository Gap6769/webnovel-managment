"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from "react-native"
import { Text, ActivityIndicator, IconButton, Menu, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { fetchChapterContent } from "../api/contentApi"
import { ChevronLeft, ChevronRight, Settings } from "lucide-react-native"

const { width } = Dimensions.get("window")

const ReaderScreen = ({ route, navigation }) => {
  const { contentId, chapterId, contentType } = route.params
  const [fontSize, setFontSize] = useState(18)
  const [menuVisible, setMenuVisible] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["chapterContent", contentId, chapterId],
    queryFn: () => fetchChapterContent(contentId, chapterId),
  })

  useEffect(() => {
    if (data?.title) {
      navigation.setOptions({ title: data.title })
    }
  }, [data, navigation])

  const navigateToChapter = (direction) => {
    if (direction === "prev" && data?.prevChapterId) {
      navigation.replace("Reader", {
        contentId,
        chapterId: data.prevChapterId,
        contentType,
      })
    } else if (direction === "next" && data?.nextChapterId) {
      navigation.replace("Reader", {
        contentId,
        chapterId: data.nextChapterId,
        contentType,
      })
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error loading chapter. Please try again.</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigateToChapter("prev")}
          disabled={!data?.prevChapterId}
          style={[styles.navButton, !data?.prevChapterId && styles.disabledButton]}
        >
          <ChevronLeft size={24} color={data?.prevChapterId ? "#6200ee" : "#bdbdbd"} />
          <Text style={[styles.navText, !data?.prevChapterId && styles.disabledText]}>Previous</Text>
        </TouchableOpacity>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton icon={() => <Settings size={24} color="#6200ee" />} onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item onPress={() => setFontSize(fontSize - 2)} title="Decrease Font Size" disabled={fontSize <= 12} />
          <Menu.Item onPress={() => setFontSize(fontSize + 2)} title="Increase Font Size" disabled={fontSize >= 24} />
          <Divider />
          <Menu.Item onPress={() => {}} title="Toggle Dark Mode" />
        </Menu>

        <TouchableOpacity
          onPress={() => navigateToChapter("next")}
          disabled={!data?.nextChapterId}
          style={[styles.navButton, !data?.nextChapterId && styles.disabledButton]}
        >
          <Text style={[styles.navText, !data?.nextChapterId && styles.disabledText]}>Next</Text>
          <ChevronRight size={24} color={data?.nextChapterId ? "#6200ee" : "#bdbdbd"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {contentType === "novel" ? (
          <Text style={[styles.novelContent, { fontSize }]}>{data.content}</Text>
        ) : (
          <View style={styles.manhwaContainer}>
            {data.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.manhwaImage} resizeMode="contain" />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigateToChapter("prev")}
          disabled={!data?.prevChapterId}
          style={[styles.footerButton, !data?.prevChapterId && styles.disabledButton]}
        >
          <ChevronLeft size={20} color={data?.prevChapterId ? "#6200ee" : "#bdbdbd"} />
          <Text style={[styles.footerButtonText, !data?.prevChapterId && styles.disabledText]}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToChapter("next")}
          disabled={!data?.nextChapterId}
          style={[styles.footerButton, !data?.nextChapterId && styles.disabledButton]}
        >
          <Text style={[styles.footerButtonText, !data?.nextChapterId && styles.disabledText]}>Next</Text>
          <ChevronRight size={20} color={data?.nextChapterId ? "#6200ee" : "#bdbdbd"} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  navText: {
    color: "#6200ee",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#bdbdbd",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  novelContent: {
    lineHeight: 24,
  },
  manhwaContainer: {
    alignItems: "center",
  },
  manhwaImage: {
    width: width - 32,
    height: width * 1.5,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  footerButtonText: {
    color: "#6200ee",
  },
})

export default ReaderScreen
