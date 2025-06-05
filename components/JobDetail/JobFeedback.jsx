import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const JobFeedback = ({ jobDetails }) => {
  const feedBack = [
    {
      avatarUrl: "https://example.com/avatar1.jpg",
      name: "Nguyễn Văn A",
      rating: 4.5,
      comment: "Công việc rất tốt, môi trường làm việc thân thiện.",
      createdAt: "2023-10-01T12:00:00Z",
    },
    {
      avatarUrl: "https://example.com/avatar2.jpg",
      name: "Trần Thị B",
      rating: 5.0,
      comment: "Rất hài lòng với công việc và đồng nghiệp.",
      createdAt: "2023-10-02T14:30:00Z",
    },
    {
      avatarUrl: "https://example.com/avatar3.jpg",
      name: "Lê Văn C",
      rating: 3.5,
      comment: "Công việc ổn, nhưng cần cải thiện một số vấn đề.",
      createdAt: "2023-10-03T09:15:00Z",
    },
  ];

  return (
    <View style={styles.descriptionSection}>
      <Text style={styles.sectionTitle}>Đánh Giá </Text>
      <View style={{ flexDirection: "column" }}>
        {feedBack.map((feedback, index) => (
          <View
            key={index}
            style={{
              marginBottom: 10,
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1,
              elevation: 2,
              width: "100%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Image
                source={{ uri: feedback.avatarUrl }}
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: "black",
                  borderRadius: 100,
                  borderWidth: 2,
                  borderColor: "#ccc",
                }}
              />
              <View style={{ marginLeft: 10, width: "75%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View
                  style={{
                    flexDirection: "column",
                    justifyContent: "flex-start",
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: "#2558B6" }}>
                    {feedback.name}
                  </Text>
                  <Text style={{ color: "#666", marginBottom: 5, fontSize: 12 }}>
                    {new Date(feedback.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                     <Text style={styles.bulletPoint}>•</Text>
                    {new Date(feedback.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                <Text style={{ color: "#FFD700", fontSize: 17 }}>
                  {"★".repeat(Math.floor(feedback.rating))}
                  {"☆".repeat(5 - Math.floor(feedback.rating))}
                </Text>
              </View>
            </View>
            <Text style={{ color: "#666", marginTop: 10 }}>
              {feedback.comment}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  descriptionSection: {
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 10,
    borderBottomColor: "#ccc",
    borderBottomWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2558B6",
  },
  sentenceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: "#2558B6",
    marginRight: 10,
    marginTop: 2,
  },
  sentenceText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flex: 1,
  },
});

export default JobFeedback;
