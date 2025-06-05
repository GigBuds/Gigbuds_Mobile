import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CalendarComp from './Calendar';

const JobSchedule = ({ jobDetails }) => {
  const getDayName = (dayOfWeek) => {
    const days = {
      1: 'Chủ Nhật',
      2: 'Thứ 2', 
      3: 'Thứ 3',
      4: 'Thứ 4',
      5: 'Thứ 5',
      6: 'Thứ 6',
      7: 'Thứ 7'
    };
    return days[dayOfWeek] || 'Unknown';
  };

  return (
    <View style={styles.descriptionSection}>
      <Text style={styles.sectionTitle}>Lịch làm việc</Text>
      
      {/* Schedule Summary */}
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleDetail}>
          • Số ca tối thiểu: {jobDetails?.jobSchedule?.minimumShift || 1} ca/tuần
        </Text>
        <Text style={styles.scheduleDetail}>
          • Tổng số ca: {jobDetails?.jobSchedule?.shiftCount || 0} ca/tuần
        </Text>
        
        {jobDetails?.jobSchedule?.jobShifts?.map((shift, index) => (
          <Text key={index} style={styles.scheduleDetail}>
            • {getDayName(shift.dayOfWeek)}: {shift.startTime} - {shift.endTime}
          </Text>
        ))}
      </View>
      
      <CalendarComp jobSchedule={jobDetails?.jobSchedule}/>
    </View>
  );
};

const styles = StyleSheet.create({
  descriptionSection: {
    borderRadius: 15,
    marginBottom: 15,
    paddingBottom: 20,
    marginHorizontal: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2558B6",
  },
  scheduleInfo: {
    borderRadius: 10,
    marginBottom: 15,
  },
  scheduleDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default JobSchedule;