import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SegmentedButtons } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import JobApplicationService from '../../../Services/JobApplicationService/JobApplicationService'
import JobCard from '../../../components/JobCard/JobCard'

const MyJob = () => {
  const [value, setValue] = useState('AcceptedJob')
  const [pageIndex, setPageIndex] = useState(null)
  
  const handleValueChange = useCallback((newValue) => {
    setValue(newValue)
    // fetchData will be called automatically by useEffect when value changes
  }, [])

  // Render job item
  const renderJobItem = ({ item }) => (
    <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.jobTitle || 'Job Title'}</Text>
      <Text style={{ color: '#666', marginTop: 5 }}>{item.companyName || 'Company Name'}</Text>
      <Text style={{ color: '#999', marginTop: 3 }}>{item.status || 'Status'}</Text>
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <SegmentedButtons
        value={value}
        onValueChange={handleValueChange}
        buttons={[
          { value: 'AcceptedJob', label: 'Đang nhận' },
          { value: 'AppliedJob', label: 'Ứng tuyển' },
          { value: 'JobHistory', label: 'Lịch sử' },
        ]}
        style={{ marginBottom: 20, marginTop: 10 }}
      />
       <JobCard 
          selectedTab={value}
          marginBottom={50}
        />

        
    </View>
  )
}

export default MyJob