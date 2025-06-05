import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'react-native';
import iconMucLuong from "../../assets/mucluong.png";
import iconKinhNghiem from "../../assets/kinhnghiem.png";
import iconVitri from "../../assets/vitri.png";
import iconExpireTime from "../../assets/expireTime.png";

const JobInfoCard = ({ jobDetails }) => {
  const getProvince = (fullAddress) => {
    if (!fullAddress) return "Chưa có thông tin tỉnh";
    const parts = fullAddress.split(",");
    return parts[parts.length - 1].trim();
  };

  const formatExpireTime = (expireTime) => {
    if (!expireTime) return "Chưa có thông tin";
    const date = new Date(expireTime);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <View style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Image source={iconMucLuong} style={styles.salaryIcon} />
          <Text style={styles.infoText}>Mức lương</Text>
          <Text style={styles.infoTextDetail}>
            {jobDetails?.salary
              ? jobDetails.salary.toLocaleString("vi-VN")
              : "0"}
            đ /{" "}
            {jobDetails?.salaryUnit === "Hour"
              ? "Giờ"
              : jobDetails?.salaryUnit === "Day"
              ? "Ngày"
              : "Ca"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Image source={iconKinhNghiem} style={styles.experienceIcon} />
          <Text style={styles.infoText}>Kinh nghiệm</Text>
          <Text style={styles.infoTextDetail}>
            {jobDetails?.experienceRequirement?.includes(
              "Không yêu cầu kinh nghiệm"
            )
              ? "Không yêu cầu"
              : "Yêu cầu kinh nghiệm"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Image source={iconVitri} style={styles.locationIcon} />
          <Text style={styles.infoText}>Vị trí</Text>
          <Text style={styles.infoTextDetail}>
            {getProvince(jobDetails?.jobLocation)}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.expireTimeContainer}>
          <Image source={iconExpireTime} style={styles.expireTimeIcon} />
          <View style={styles.expireTimeTextContainer}>
            <Text style={styles.infoText}>Hạn ứng tuyển</Text>
            <Text style={styles.infoTextDetail}>
              {formatExpireTime(jobDetails?.expireTime)}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 3,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    marginBottom: 10,
  },
  infoItem: {
    alignItems: "center",
    gap: 10,
  },
  expireTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  expireTimeTextContainer: {
    alignItems: "center",
  },
  expireTimeIcon: {
    width: 20,
    height: 32,
  },
  salaryIcon: {
    width: 50,
    height: 50,
  },
  experienceIcon: {
    width: 50,
    height: 50,
  },
  locationIcon: {
    width: 44,
    height: 50,
  },
  infoText: {
    fontSize: 13,
    color: "gray",
  },
  infoTextDetail: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
});

export default JobInfoCard;