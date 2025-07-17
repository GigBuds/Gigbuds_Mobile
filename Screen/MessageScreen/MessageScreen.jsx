import React from "react";
import { MessagingProvider } from "../../context/MessagingContext";
import MessagingContainer from "../../components/Messaging/MessagingContainer";
import MessagingErrorBoundary from "../../components/Messaging/ErrorBoundary";

const MessageScreen = () => {
  return (
    <MessagingErrorBoundary>
      <MessagingProvider>
        <MessagingContainer />
      </MessagingProvider>
    </MessagingErrorBoundary>
  );
};

export default MessageScreen;
