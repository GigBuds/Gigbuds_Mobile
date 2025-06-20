import React, { createContext, useContext } from "react";
import { useSignalR } from "../Services/SignalRService/useSignalR";

const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
  const { signalRConnection, connect } = useSignalR({
    groups: ["jobseekers"],
  });

  return (
    <SignalRContext.Provider value={{ signalRConnection, connect }}>
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
