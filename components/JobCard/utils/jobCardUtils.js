// Utility functions for JobCard component

export const getDistrict = (location) => {
  if (!location) return "";
  const parts = location.split(",");
  return parts.length > 1 ? parts[parts.length - 2].trim() : "";
};

export const getExperienceRequirement = (eR) => {
  if (!eR) return "";
  const parts = eR.split(",");
  return parts.length > 1 ? parts[0].trim() : "";
};

export const getTimeAgo = (updateTime) => {
  if (!updateTime) return "";
  const updatedDate = new Date(updateTime);
  const now = new Date();

  updatedDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = now - updatedDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  return `${Math.abs(diffDays)} ngày trước`;
};

export const getCity = (location) => {
  if (!location) return "";
  const parts = location.split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : "";
};

export const getJobId = (job, selectedTab) => {
  const isApplicationTab = ["AcceptedJob", "AppliedJob", "JobHistory"].includes(selectedTab);
  return isApplicationTab ? job.id : job.jobPostId || job.id;
};
