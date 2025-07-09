import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import asyncStorageService from "../Services/AsyncStorageService";

// ==================== USER STATE TYPES ====================

interface UserState {
  isAuthenticated: boolean;
  userId: number | null;
  fullName: string;
  email: string;
  avatar: string;
  phoneNumber: string;
  token: string;
  refreshToken: string;
  isLoading: boolean;
  error: string | null;
}

// ==================== USER ACTIONS ====================

type UserAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "LOGIN_SUCCESS";
      payload: Omit<UserState, "isLoading" | "error" | "isAuthenticated">;
    }
  | { type: "LOGOUT" }
  | {
      type: "UPDATE_PROFILE";
      payload: Partial<
        Omit<UserState, "isLoading" | "error" | "isAuthenticated">
      >;
    }
  | { type: "RESTORE_USER"; payload: UserState };

// ==================== INITIAL STATE ====================

const initialState: UserState = {
  isAuthenticated: false,
  userId: null,
  fullName: "",
  email: "",
  avatar: "",
  phoneNumber: "",
  token: "",
  refreshToken: "",
  isLoading: true, // Start with loading true to check AsyncStorage
  error: null,
};

// ==================== USER REDUCER ====================

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "LOGOUT":
      return {
        ...initialState,
        isLoading: false,
      };

    case "UPDATE_PROFILE":
      return {
        ...state,
        ...action.payload,
      };

    case "RESTORE_USER":
      return { ...action.payload, isLoading: false };

    default:
      return state;
  }
}

// ==================== CONTEXT TYPES ====================

interface UserContextType {
  user: UserState;
  login: (
    userData: Omit<UserState, "isLoading" | "error" | "isAuthenticated">
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<Omit<UserState, "isLoading" | "error" | "isAuthenticated">>
  ) => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

// ==================== CONTEXT CREATION ====================

const UserContext = createContext<UserContextType | undefined>(undefined);

// ==================== USER PROVIDER ====================

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, dispatch] = useReducer(userReducer, initialState);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const savedUser = await asyncStorageService.getUserState();
        if (savedUser) {
          console.log("👤 UserContext: Restored user from AsyncStorage");
          dispatch({ type: "RESTORE_USER", payload: savedUser });
        } else {
          console.log("👤 UserContext: No saved user found");
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } catch (error) {
        console.error(
          "❌ UserContext: Failed to load user from storage:",
          error
        );
        dispatch({ type: "SET_ERROR", payload: "Failed to load user data" });
      }
    };

    loadUserFromStorage();
  }, []);

  // Save user to AsyncStorage whenever user state changes (except loading/error)
  useEffect(() => {
    const saveUserToStorage = async () => {
      if (!user.isLoading && user.isAuthenticated) {
        try {
          await asyncStorageService.setUserState(user);
          console.log("💾 UserContext: Saved user to AsyncStorage");
        } catch (error) {
          console.error(
            "❌ UserContext: Failed to save user to storage:",
            error
          );
        }
      }
    };

    saveUserToStorage();
  }, [user]);

  // ==================== USER ACTIONS ====================

  const login = async (
    userData: Omit<UserState, "isLoading" | "error" | "isAuthenticated">
  ) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "LOGIN_SUCCESS", payload: userData });
      console.log("✅ UserContext: User logged in successfully");
    } catch (error) {
      console.error("❌ UserContext: Login failed:", error);
      dispatch({ type: "SET_ERROR", payload: "Login failed" });
    }
  };

  const logout = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await asyncStorageService.clearUserState();
      dispatch({ type: "LOGOUT" });
      console.log("👋 UserContext: User logged out successfully");
    } catch (error) {
      console.error("❌ UserContext: Logout failed:", error);
      dispatch({ type: "SET_ERROR", payload: "Logout failed" });
    }
  };

  const updateProfile = async (
    updates: Partial<Omit<UserState, "isLoading" | "error" | "isAuthenticated">>
  ) => {
    try {
      dispatch({ type: "UPDATE_PROFILE", payload: updates });
      console.log("🔄 UserContext: Profile updated successfully");
    } catch (error) {
      console.error("❌ UserContext: Profile update failed:", error);
      dispatch({ type: "SET_ERROR", payload: "Profile update failed" });
    }
  };

  const setError = (error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  // ==================== CONTEXT VALUE ====================

  const contextValue: UserContextType = {
    user,
    login,
    logout,
    updateProfile,
    setError,
    setLoading,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
