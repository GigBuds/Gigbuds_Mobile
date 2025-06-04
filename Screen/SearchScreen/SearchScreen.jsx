import { View, StyleSheet } from "react-native";
import React, { use, useEffect } from "react";
import SearchBar from "../../components/SearchBar/SearchBar";
import JobCard from "../../components/JobCard/JobCard";
import FilterSection from "../../components/FilterSection/FilterSection";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchResults, setSearchResults] = React.useState(null);
  const [appliedFilters, setAppliedFilters] = React.useState({});
  const [filterType, setFilterType] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [searchParams, setSearchParams] = React.useState({}); // Add this state
  const [selectedTab, setSelectedTab] = React.useState("Mới Nhất"); // Fixed typo here
  const [searchInput, setSearchInput] = React.useState("");
  const loadAppliedFilters = async () => {
    try {
      const salaryFilter = await AsyncStorage.getItem('isSalaryFilterApplied');
      
      setAppliedFilters({
        salary: salaryFilter === 'true',
      });
    } catch (error) {
      console.error("Error loading applied filters:", error);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      
      // Build search params from all filters
      const searchParams = {};
      
      // Get salary filter
      const salaryFilterApplied = await AsyncStorage.getItem('isSalaryFilterApplied');
      if (salaryFilterApplied === 'true') {
        const salaryFilter = await AsyncStorage.getItem('salaryFilter');
        if (salaryFilter) {
          const parsedSalaryFilter = JSON.parse(salaryFilter);
          Object.assign(searchParams, parsedSalaryFilter);
        }
      }

      setSearchParams(searchParams); // Store searchParams in state
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults({ items: [], totalCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Load filters and perform search when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadAppliedFilters();
      performSearch();
    }, [])
  );

  const handleFilterPress = (filterValue) => {
    // Navigate to the specific filter screen
    if (filterValue === "Mức Lương") {
      navigation.navigate("Mức Lương");
    }
  };

  return (
    <View style={styles.container}>
      <SearchBar setSearchInput={setSearchInput} />
      <FilterSection 
        onFilterPress={handleFilterPress} 
        filterType={filterType} 
        appliedFilters={appliedFilters} 
        setSelectedTab={setSelectedTab}
        selectedTab={selectedTab} // Fixed prop name here
      />
      <JobCard 
        searchInput={searchInput}
        selectedTab={selectedTab}
        searchParams={searchParams}
        appliedFilters={appliedFilters}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SearchScreen;
