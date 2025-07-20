import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSignalR } from "../Services/SignalRService/useSignalR";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const checkAuthentication = useCallback(async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const isAuth = !!accessToken;
      setIsAuthenticated(isAuth);
      setAuthChecked(true);
      console.log(
        "SignalRProvider: Authentication check:",
        isAuth ? "Authenticated" : "Not authenticated"
      );
      return isAuth;
    } catch (error) {
      console.error(
        "SignalRProvider: Error checking authentication:",
        error
      );
      setIsAuthenticated(false);
      setAuthChecked(true);
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuthentication();

    const checkAuthOnFocus = () => {
      checkAuthentication();
    };

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkAuthOnFocus();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [checkAuthentication]);

  const signalRConfig = {
    groups: ["jobseekers"],
    autoConnect: false,
    requireAuth: true,
  };

  const {
    signalRService,
    connect,
    disconnect,
    connectionStatus,
    isAuthenticated: signalRAuth,
    checkAuthentication: signalRCheckAuth,
  } = useSignalR(signalRConfig);

  useEffect(() => {
    if (
      isAuthenticated &&
      authChecked &&
      !connectionStatus.isConnected &&
      !connectionStatus.isConnecting
    ) {
      console.log("SignalRProvider: User authenticated, connecting SignalR");
      connect();
    } else if (
      !isAuthenticated &&
      authChecked &&
      connectionStatus.isConnected
    ) {
      console.log(
        "SignalRProvider: User not authenticated, disconnecting SignalR"
      );
      disconnect();
    }
  }, [
    isAuthenticated,
    authChecked,
    connectionStatus.isConnected,
    connectionStatus.isConnecting,
    connect,
    disconnect,
  ]);

  const connectSignalR = useCallback(async () => {
    if (isAuthenticated) {
      console.log("SignalRProvider: Manual connection requested");
      await connect();
    } else {
      console.log(
        "SignalRProvider: Cannot connect - user not authenticated"
      );
    }
  }, [isAuthenticated, connect]);

  const disconnectSignalR = useCallback(async () => {
    console.log("SignalRProvider: Manual disconnection requested");
    await disconnect();
  }, [disconnect]);

  const contextValue = {
    signalRService,
    connect: connectSignalR,
    disconnect: disconnectSignalR,
    connectionStatus,
    isAuthenticated,
    authChecked,
    checkAuthentication,
  };

  return (
    <SignalRContext.Provider value={contextValue}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalRContext = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error("useSignalRContext must be used within a SignalRProvider");
  }
  return context;
};
