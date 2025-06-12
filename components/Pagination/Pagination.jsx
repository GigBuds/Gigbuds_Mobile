import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import IonIcons from '@expo/vector-icons/Ionicons'

const Pagination = ({ pageLength = 2, setPageIndex, currentPage = 1 }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      setPageIndex(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < pageLength) {
      setPageIndex(currentPage + 1);
    }
  };

  const handlePageSelect = (page) => {
    setPageIndex(page);
  };

  return (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginVertical: 10 
    }}>
      {/* Previous Button */}
      <TouchableOpacity 
        style={{ 
          marginHorizontal: 5,
          opacity: currentPage === 1 ? 0.3 : 1
        }}
        onPress={handlePrevious}
        disabled={currentPage === 1}
      >
        <IonIcons 
          name="chevron-back" 
          size={24} 
          color={currentPage === 1 ? "gray" : "black"} 
        />
      </TouchableOpacity>

      {/* Page Numbers */}
      {Array.from({ length: pageLength }, (_, index) => {
        const pageNumber = index + 1;
        const isCurrentPage = pageNumber === currentPage;
        
        return (
          <TouchableOpacity
            key={pageNumber}
            onPress={() => handlePageSelect(pageNumber)}
            style={{
              marginHorizontal: 5,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: isCurrentPage ? '#2558B6' : 'transparent',
              borderRadius: 5,
              borderWidth: 1,
              borderColor: isCurrentPage ? '#2558B6' : '#ddd',
            }}
          >
            <Text style={{
              fontSize: 16,
              color: isCurrentPage ? 'white' : 'black',
              fontWeight: isCurrentPage ? 'bold' : 'normal'
            }}>
              {pageNumber}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Next Button */}
      <TouchableOpacity
        style={{ 
          marginHorizontal: 5,
          opacity: currentPage === pageLength ? 0.3 : 1
        }}
        onPress={handleNext}
        disabled={currentPage === pageLength}
      >
        <IonIcons 
          name="chevron-forward" 
          size={24} 
          color={currentPage === pageLength ? "gray" : "black"} 
        />
      </TouchableOpacity>
    </View>
  )
}

export default Pagination