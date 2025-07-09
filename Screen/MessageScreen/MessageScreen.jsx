import React from "react";
import { UserProvider } from "../../context/UserContext";
import { MessagingProvider } from "../../context/MessagingContext";
import { DraftProvider } from "../../context/DraftContext";
import MessagingContainer from "../../components/messaging/MessagingContainer";

const MessageScreen = () => {
  return (
    <UserProvider>
      <MessagingProvider>
        <DraftProvider>
          <MessagingContainer />
        </DraftProvider>
      </MessagingProvider>
    </UserProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});

export default MessageScreen;
