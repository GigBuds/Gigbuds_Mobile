import signalRService from "./SignalRService";

export function setupNotificationHandlers() {
  const connection = signalRService.connection;

  // Job seeker notifications
  connection.on("NotifyNewPostFromFollowedEmployer", (data) => {
    console.log("SignalR: New post from followed employer", data);
    signalRService.triggerCallback("onNotificationReceived", data);
  });
  connection.on("NotifyJobFeedbackReceived", (data) => {
    console.log("SignalR: Job feedback received", data);
    signalRService.triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobFeedbackSent", (data) => {
    console.log("SignalR: Job feedback sent", data);
    signalRService.triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobApplicationAccepted", (data) => {
    console.log("SignalR: Job application accepted", data);
    signalRService.triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobApplicationRejected", (data) => {
    console.log("SignalR: Job application rejected", data);
    signalRService.triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobApplicationRemovedFromApproved", (data) => {
    console.log("SignalR: Job application removed from approved", data);
    signalRService.triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyJobCompleted", (data) => {
    console.log("SignalR: Job completed", data);
    signalRService.triggerCallback("onNotificationReceived", data);
  });

  connection.on("NotifyNewJobPostMatching", (payload, additionalPayload) => {
    console.log("SignalR: New job post matching", payload, additionalPayload);
    signalRService.triggerCallback("onNotificationReceived", payload);
  });

  connection.on("NotifyProfileViewedByEmployer", (data) => {
    console.log("SignalR: Profile viewed by employer", data);
    signalRService.triggerCallback("onNotificationReceived", data);
  });
}
