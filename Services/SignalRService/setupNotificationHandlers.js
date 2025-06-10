export function setupNotificationHandlers(
  connection,
  handleNotificationCallback
) {
  if (!connection) return;

  // Job seeker notifications
  connection.on("NotifyNewPostFromFollowedEmployer", (data) => {
    console.log("SignalR: New post from followed employer", data);
    handleNotificationCallback("job", {
      title: "Có việc làm mới từ nhà tuyển dụng theo dõi",
      message:
        data?.message || "Nhà tuyển dụng bạn theo dõi vừa đăng công việc mới",
      data: data,
      type: "job",
    });
  });

  connection.on("NotifyJobFeedbackReceived", (data) => {
    console.log("SignalR: Job feedback received", data);
    handleNotificationCallback("feedback", {
      title: "Nhận được đánh giá công việc",
      message: data?.message || "Bạn vừa nhận được đánh giá từ nhà tuyển dụng",
      data: data,
      type: "feedback",
    });
  });

  connection.on("NotifyJobFeedbackSent", (data) => {
    console.log("SignalR: Job feedback sent", data);
    handleNotificationCallback("feedback", {
      title: "Đánh giá đã được gửi",
      message: data?.message || "Đánh giá của bạn đã được gửi thành công",
      data: data,
      type: "feedback",
    });
  });

  connection.on("NotifyJobApplicationAccepted", (data) => {
    console.log("SignalR: Job application accepted", data);
    handleNotificationCallback("application", {
      title: "Đơn ứng tuyển được chấp nhận",
      message:
        data?.message || "Chúc mừng! Đơn ứng tuyển của bạn đã được chấp nhận",
      data: data,
      type: "application",
    });
  });

  connection.on("NotifyJobApplicationRejected", (data) => {
    console.log("SignalR: Job application rejected", data);
    handleNotificationCallback("application", {
      title: "Đơn ứng tuyển bị từ chối",
      message:
        data?.message || "Đơn ứng tuyển của bạn không được chấp nhận lần này",
      data: data,
      type: "application",
    });
  });

  connection.on("NotifyJobApplicationRemovedFromApproved", (data) => {
    console.log("SignalR: Job application removed from approved", data);
    handleNotificationCallback("application", {
      title: "Đơn ứng tuyển bị hủy phê duyệt",
      message: data?.message || "Đơn ứng tuyển của bạn đã bị hủy phê duyệt",
      data: data,
      type: "application",
    });
  });

  connection.on("NotifyJobCompleted", (data) => {
    console.log("SignalR: Job completed", data);
    handleNotificationCallback("schedule", {
      title: "Công việc hoàn thành",
      message: data?.message || "Công việc của bạn đã được đánh dấu hoàn thành",
      data: data,
      type: "schedule",
    });
  });

  connection.on("NotifyNewJobPostMatching", (payload, additionalPayload) => {
    console.log("SignalR: New job post matching", payload, additionalPayload);
    handleNotificationCallback("job", {
      title: "Có việc làm phù hợp",
      message: payload || "Có công việc mới phù hợp với hồ sơ của bạn",
      data: payload,
      type: "job",
      additionalPayload: additionalPayload,
    });
  });

  connection.on("NotifyProfileViewedByEmployer", (data) => {
    console.log("SignalR: Profile viewed by employer", data);
    handleNotificationCallback("profile", {
      title: "Hồ sơ được xem",
      message: data?.message || "Nhà tuyển dụng đã xem hồ sơ của bạn",
      data: data,
      type: "profile",
    });
  });
}
