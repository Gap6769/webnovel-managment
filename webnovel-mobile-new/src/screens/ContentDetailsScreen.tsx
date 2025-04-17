import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native"
import { Text, Card, Button, Chip, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchContentDetails, refreshContent } from "../api/contentApi"
import { RefreshCw, Edit, Trash2 } from "lucide-react-native"

const ContentDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ["contentDetails", id],
    queryFn: () => fetchContentDetails(id),
  })

  const refreshMutation = useMutation({
    mutationFn: refreshContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contentDetails", id] })
    },
  })

  const renderChapterItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("Reader", {
          contentId: id,
          chapterId: item.id,
          contentType: data.type,
        })
      }
      style={styles.chapterItem}
    >
      <Card style={styles.chapterCard}>
        <Card.Content>
          <Text variant="titleMedium" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="bodySmall" style={styles.chapterDate}>
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
          {item.isNew && (
            <Chip compact mode="outlined" style={styles.newChip}>
              New
            </Chip>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

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
        <Text>Error loading content details. Please try again.</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Card style={styles.coverCard}>
          <Card.Cover source={{ uri: data.coverUrl || "https://via.placeholder.com/300" }} />
        </Card>

        <View style={styles.infoContainer}>
          <Text variant="headlineSmall" style={styles.title}>
            {data.title}
          </Text>
          <Text variant="bodyMedium">Source: {data.source}</Text>
          <View style={styles.chipRow}>
            <Chip mode="outlined" style={styles.chip}>
              {data.type}
            </Chip>
            <Chip mode="outlined" style={styles.chip}>
              {data.chapters.length} chapters
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.lastUpdated}>
            Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          icon={() => <RefreshCw size={18} color="#fff" />}
          onPress={() => refreshMutation.mutate(id)}
          loading={refreshMutation.isPending}
          style={styles.refreshButton}
        >
          Refresh
        </Button>

        <View style={styles.iconButtonsContainer}>
          <IconButton
            icon={() => <Edit size={20} color="#6200ee" />}
            mode="outlined"
            onPress={() => {
              /* Navigate to edit screen */
            }}
          />
          <IconButton
            icon={() => <Trash2 size={20} color="#f44336" />}
            mode="outlined"
            onPress={() => {
              /* Show delete confirmation */
            }}
          />
        </View>
      </View>

      <Text variant="titleMedium" style={styles.chaptersTitle}>
        Chapters
      </Text>

      <FlatList
        data={data.chapters}
        renderItem={renderChapterItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.chaptersList}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    marginBottom: 16,
  },
  coverCard: {
    width: 120,
    height: 180,
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
  },
  lastUpdated: {
    marginTop: 8,
    color: "#757575",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: "#6200ee",
  },
  iconButtonsContainer: {
    flexDirection: "row",
  },
  chaptersTitle: {
    marginBottom: 8,
  },
  chaptersList: {
    paddingBottom: 16,
  },
  chapterItem: {
    marginBottom: 8,
  },
  chapterCard: {
    backgroundColor: "#ffffff",
  },
  chapterDate: {
    color: "#757575",
    marginTop: 4,
  },
  newChip: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#4caf50",
    color: "#ffffff",
  },
})

export default ContentDetailsScreen
