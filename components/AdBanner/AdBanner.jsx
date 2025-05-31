import { View, Text, Image } from 'react-native'
import React from 'react'
import banner from '../../assets/gigbuds-banner.png' // Adjust the path as necessary
const AdBanner = () => {
  return (
    <View>
      <Image
        source={banner}
        style={{
          width: '100%',
          height: 200,
          borderRadius: 10,
        }}
        resizeMode="cover"
        />
    </View>
  )
}

export default AdBanner