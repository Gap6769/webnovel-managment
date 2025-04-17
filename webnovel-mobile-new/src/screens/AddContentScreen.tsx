"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Text, TextInput, Button, RadioButton, Divider, Snackbar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addContent } from "../api/contentApi"

const AddContentScreen = ({ navigation }) => {
  const queryClient = useQueryClient()
  const [contentType, setContentType] = useState("novel")
  const [title, setTitle] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [sourceType, setSourceType] = useState("")
  const [customSelectors, setCustomSelectors] = useState({
    titleSelector: "",
    chapterListSelector: "",
    chapterContentSelector: "",
    nextPageSelector: "",
    imageSelector: "", // For manhwas
  })
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")

  const addContentMutation = useMutation({
    mutationFn: addContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] })
      setSnackbarMessage("Content added successfully!")
      setSnackbarVisible(true)
      resetForm()
    },
    onError: (error) => {
      setSnackbarMessage(`Error: ${error.message}`)
      setSnackbarVisible(true)
    },
  })

  const resetForm = () => {
    setTitle("")
    setSourceUrl("")
    setSourceType("")
    setCustomSelectors({
      titleSelector: "",
      chapterListSelector: "",
      chapterContentSelector: "",
      nextPageSelector: "",
      imageSelector: "",
    })
  }

  const handleSubmit = () => {
    if (!title || !sourceUrl) {
      setSnackbarMessage("Title and source URL are required")
      setSnackbarVisible(true)
      return
    }

    const contentData = {
      title,
      type: contentType,
      sourceUrl,
      sourceType: sourceType || "custom",
      selectors: customSelectors,
    }

    addContentMutation.mutate(contentData)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text variant="headlineMedium" style={styles.title}>
          Add New Content
        </Text>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Content Type
        </Text>
        <RadioButton.Group onValueChange={(value) => setContentType(value)} value={contentType}>
          <View style={styles.radioContainer}>
            <RadioButton.Item label="Web Novel" value="novel" />
            <RadioButton.Item label="Manhwa" value="manhwa" />
          </View>
        </RadioButton.Group>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Basic Information
        </Text>
        <TextInput label="Title" value={title} onChangeText={setTitle} style={styles.input} mode="outlined" />

        <TextInput
          label="Source URL"
          value={sourceUrl}
          onChangeText={setSourceUrl}
          style={styles.input}
          mode="outlined"
          placeholder="https://example.com/novel/123"
        />

        <TextInput
          label="Source Type (optional)"
          value={sourceType}
          onChangeText={setSourceType}
          style={styles.input}
          mode="outlined"
          placeholder="wuxiaworld, royalroad, etc."
          helperText="Leave empty for custom source"
        />

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Custom Selectors
        </Text>
        <Text variant="bodySmall" style={styles.helperText}>
          Define CSS selectors to help the scraper find content on the page
        </Text>

        <TextInput
          label="Title Selector"
          value={customSelectors.titleSelector}
          onChangeText={(text) => setCustomSelectors({ ...customSelectors, titleSelector: text })}
          style={styles.input}
          mode="outlined"
          placeholder=".novel-title h1"
        />

        <TextInput
          label="Chapter List Selector"
          value={customSelectors.chapterListSelector}
          onChangeText={(text) => setCustomSelectors({ ...customSelectors, chapterListSelector: text })}
          style={styles.input}
          mode="outlined"
          placeholder=".chapter-list a"
        />

        <TextInput
          label="Chapter Content Selector"
          value={customSelectors.chapterContentSelector}
          onChangeText={(text) => setCustomSelectors({ ...customSelectors, chapterContentSelector: text })}
          style={styles.input}
          mode="outlined"
          placeholder=".chapter-content"
        />

        <TextInput
          label="Next Page Selector"
          value={customSelectors.nextPageSelector}
          onChangeText={(text) => setCustomSelectors({ ...customSelectors, nextPageSelector: text })}
          style={styles.input}
          mode="outlined"
          placeholder=".pagination .next"
        />

        {contentType === "manhwa" && (
          <TextInput
            label="Image Selector"
            value={customSelectors.imageSelector}
            onChangeText={(text) => setCustomSelectors({ ...customSelectors, imageSelector: text })}
            style={styles.input}
            mode="outlined"
            placeholder=".chapter-content img"
          />
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={addContentMutation.isPending}
          disabled={addContentMutation.isPending}
        >
          Add to Library
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  divider: {
    marginVertical: 16,
  },
  helperText: {
    marginBottom: 8,
    color: "#757575",
  },
  button: {
    marginTop: 16,
    marginBottom: 24,
    paddingVertical: 6,
    backgroundColor: "#6200ee",
  },
})

export default AddContentScreen
