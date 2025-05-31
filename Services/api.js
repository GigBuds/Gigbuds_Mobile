import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";


// const baseUrl = process.env.EXPO_PUBLIC_LOCAL_API_URL || "locahttps://localhost:53460/api/v1/"
const baseUrl = process.env.EXPO_PUBLIC_DEPLOY_API_URL || "https://localhost:53460/api/v1/"
const config = {
  baseUrl,
  timeout: 3000000,
};
const api = axios.create(config);
api.defaults.baseURL = baseUrl;

const handleBefore = async (config) => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (error) {
    console.error("Error getting access token:", error);
  }
  return config;
};

const handleError = (error) => {
  console.error("API Error:", error);
  return Promise.reject(error);
};

api.interceptors.request.use(handleBefore, handleError);

export default api;