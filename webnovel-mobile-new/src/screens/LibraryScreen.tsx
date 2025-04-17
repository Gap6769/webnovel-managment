"use client"

import { useState } from "react"
import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native"
import { Text, Searchbar, Chip, Card, ActivityIndicator } from "react-native-paper"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { fetchLibrary } from "../api/contentApi"

const LibraryScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all") // 'all', 'novel', 'manhwa'

  const { data, isLoading, error } = useQuery({
    queryKey: ["library", filter],
    queryFn: () => fetchLibrary(filter),
  })

  const filteredData = data?.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase())) || []

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("ContentDetails", { id: item.id })}
      style={styles.cardContainer}
    >
      <Card style={styles.card}>
        <Card.Cover source={{ uri: item.coverUrl || "https://via.placeholder.com/150" }} />
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="bodySmall" numberOfLines={1}>
            {item.source}
          </Text>
          <View style={styles.chipContainer}>
            <Chip compact mode="outlined" style={styles.typeChip}>
              {item.type}
            </Chip>
            <Chip compact mode="outlined" style={styles.chapterChip}>
              {item.chapters} chapters
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        My Library
      </Text>
      <Searchbar placeholder="Search" onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} />

      <View style={styles.filterContainer}>
        <Chip selected={filter === "all"} onPress={() => setFilter("all")} style={styles.filterChip}>
          All
        </Chip>
        <Chip selected={filter === "novel"} onPress={() => setFilter("novel")} style={styles.filterChip}>
          Novels
        </Chip>
        <Chip selected={filter === "manhwa"} onPress={() => setFilter("manhwa")} style={styles.filterChip}>
          Manhwas
        </Chip>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text>Error loading library. Please try again.</Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.centered}>
          <Text>No content found. Add some novels or manhwas!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
        />
      )}
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
  searchBar: {
    marginBottom: 16,
    elevation: 0,
    backgroundColor: "#e0e0e0",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    paddingBottom: 16,
  },
  cardContainer: {
    flex: 1,
    padding: 4,
    maxWidth: "50%",
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  typeChip: {
    marginRight: 4,
    height: 24,
  },
  chapterChip: {
    height: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default LibraryScreen
