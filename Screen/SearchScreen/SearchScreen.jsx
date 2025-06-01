import { View, StyleSheet } from "react-native";
import React, { use, useEffect } from "react";
import SearchBar from "../../components/SearchBar/SearchBar";
import JobCard from "../../components/JobCard/JobCard";
import FilterSection from "../../components/FilterSection/FilterSection";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import JobPostService from "../../Services/JobPostService/JobPostService";

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchResults, setSearchResults] = React.useState(null);
  const [appliedFilters, setAppliedFilters] = React.useState({});
  const [filterType, setFilterType] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const loadAppliedFilters = async () => {
    try {
      const salaryFilter = await AsyncStorage.getItem('isSalaryFilterApplied');
      const positionFilter = await AsyncStorage.getItem('isPositionFilterApplied');
      const experienceFilter = await AsyncStorage.getItem('isExperienceFilterApplied');
      
      setAppliedFilters({
        salary: salaryFilter === 'true',
        position: positionFilter === 'true',
        experience: experienceFilter === 'true'
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
      
      // Get position filter (add similar logic for other filters)
      const positionFilterApplied = await AsyncStorage.getItem('isPositionFilterApplied');
      if (positionFilterApplied === 'true') {
        const positionFilter = await AsyncStorage.getItem('positionFilter');
        if (positionFilter) {
          const parsedPositionFilter = JSON.parse(positionFilter);
          Object.assign(searchParams, parsedPositionFilter);
        }
      }
      
      // Get experience filter (add similar logic for other filters)
      const experienceFilterApplied = await AsyncStorage.getItem('isExperienceFilterApplied');
      if (experienceFilterApplied === 'true') {
        const experienceFilter = await AsyncStorage.getItem('experienceFilter');
        if (experienceFilter) {
          const parsedExperienceFilter = JSON.parse(experienceFilter);
          Object.assign(searchParams, parsedExperienceFilter);
        }
      }

      console.log('Searching with params:', searchParams);
      
      // Perform search
      const result = await JobPostService.searchJobPosts(searchParams);
      
      if (result.success) {
        setSearchResults({
          items: result.data.items || [],
          totalCount: result.data.totalCount || 0
        });
      } else {
        console.error("Search failed:", result.error);
        setSearchResults({ items: [], totalCount: 0 });
      }
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
    if (filterValue === "Vị trí") {
      navigation.navigate("Vị trí");
    }
    if (filterValue === "Kinh nghiệm") {
      navigation.navigate("Kinh nghiệm");
    }
  };

  return (
    <View style={styles.container}>
      <SearchBar />
      <FilterSection 
        onFilterPress={handleFilterPress} 
        filterType={filterType} 
        appliedFilters={appliedFilters} 
      />
      <JobCard 
        searchResults={searchResults} 
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
