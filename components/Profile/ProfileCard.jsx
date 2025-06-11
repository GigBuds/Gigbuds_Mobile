import { View, Text } from "react-native";

const ProfileCard = ({ title, subTitle, startDate, endDate }) => {
  // Function to format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
        marginBottom: 5,
        paddingVertical: 20,
        gap: 25,
        borderLeftColor: "#2558B6",
        borderRadius: 10,
        borderLeftWidth: 5,
      }}
    >
      <View style={{gap:5}}>
        <Text style={{ fontSize: 14, fontWeight: "bold", color: "#2558B6" }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: "#555" }}>{subTitle}</Text>
        <Text style={{ fontSize: 12, color: "#999" }}>
          {formatDate(startDate)} - {formatDate(endDate)}
        </Text>
      </View>
    </View>
  );
};

export default ProfileCard;
