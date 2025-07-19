export function setupNotificationHandlers(connection, triggerCallback) {
  console.log("SIGNALR SETUP NOTIFICATION HANDLERS", triggerCallback);
  // Job seeker notifications
  connection.on("NotifyNewPostFromFollowedEmployer", (data) => {
    // TODO
    console.log("SignalR: New post from followed employer", data);
    triggerCallback("onNotificationReceived", data);
  });
  connection.on("NotifyJobFeedbackReceived", (data) => {
    // TODO
    console.log("SignalR: Job feedback received", data);
    triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobFeedbackSent", (data) => {
    // TODO
    console.log("SignalR: Job feedback sent", data);
    triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobApplicationAccepted", (data) => {
    console.log("SignalR: Job application accepted", data);
    triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobApplicationRejected", (data) => {
    console.log("SignalR: Job application rejected", data);
    triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobApplicationRemovedFromApproved", (data) => {
    console.log("SignalR: Job application removed from approved", data);
    triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobCompleted", (data) => {
    // TODO
    console.log("SignalR: Job completed", data);
    triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyNewJobPostMatching", (payload) => {
    console.log("SignalR: New job post matching", payload);
    triggerCallback("onNotificationReceived", payload);
  });

  connection.on("NotifyProfileViewedByEmployer", (data) => {
    // TODO
    console.log("SignalR: Profile viewed by employer", data);
    triggerCallback("onNotificationReceived", data);
  });
}
