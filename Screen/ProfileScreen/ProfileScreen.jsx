import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Profile = () => {
  const navigation = useNavigation()
  
  const options = [
    {
      title:'Công việc của tôi',
      link:'MyJobs',
      icon: <Ionicons name="briefcase" size={30} color="#2558B6" />
    },
    {
      title:'Công việc đã lưu',
      link:'savedjobs',
      icon: <Ionicons name="bookmark" size={30} color="#2558B6" />
    },
    {
      title:'Hỗ trợ',
      link:'support',
      icon: <Ionicons name="help-circle" size={30} color="#2558B6" />
    },
    {
      title:'Điều khoản/Chính sách',
      link:'termandprivacy',
      icon: <Ionicons name="document-text" size={30} color="#2558B6" />
    }
  ]

  const handleLogout = async () => {
    try {
      Alert.alert(
        "Đăng xuất",
        "Bạn có chắc chắn muốn đăng xuất?",
        [
          {
            text: "Hủy",
            style: "cancel"
          },
          {
            text: "Đăng xuất",
            onPress: async () => {
              // Clear stored user data
              await AsyncStorage.multiRemove([
                'userId',
                'userName',
                'accessToken',
                'idToken',
                'salaryFilter',
                'isSalaryFilterApplied'
              ]);
              
              // Navigate to Login stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
    }
  };

  return (
    <View>
      <View style={{ padding: 20, backgroundColor:'white', borderRadius: 20 }}>
        {options.map((option, index) => (
          <TouchableOpacity
            onPress={() => navigation.navigate(option.link)}
            key={index} 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 18, 
              borderBottomColor: '#ccc' 
            }}
          >
            {option.icon}
            <Text 
              style={{ 
                marginLeft: 10, 
                fontSize: 20, 
                color: 'black' 
              }} 
            >
              {option.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ padding: 20, backgroundColor:'white', borderRadius: 20, marginTop:20 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            borderBottomColor: '#ccc' 
          }}
        >
          <Ionicons name="log-out" size={30} color="#2558B6" />
          <Text 
            style={{ 
              marginLeft: 10, 
              fontSize: 20, 
              color: 'black' 
            }} 
          >
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default Profile