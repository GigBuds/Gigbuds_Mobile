import { View, Text } from 'react-native'
import React from 'react'
import SearchBar from '../../components/SearchBar/SearchBar'
import JobCard from '../../components/JobCard/JobCard'

const SearchScreen = () => {
  return (
    <View>
      <SearchBar/>
      <JobCard/>
    </View>
  )
}

export default SearchScreen