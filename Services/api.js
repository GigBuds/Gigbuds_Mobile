import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const baseURL = process.env.EXPO_PUBLIC_LOCAL_API_URL || "locahttps://localhost:53460/api/v1/"
// const baseURL = "https://gigbuds-c3fagtfwe2brewha.eastasia-01.azurewebsites.net/api/v1/";
const config = {
  baseURL,
  timeout: 3000000,
};
const api = axios.create(config);
api.defaults.baseURL = baseURL;

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
