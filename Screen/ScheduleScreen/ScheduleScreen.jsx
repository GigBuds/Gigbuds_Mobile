import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Calendar } from 'react-native-big-calendar';
import { Ionicons } from '@expo/vector-icons';
import JobSeekerScheduleService from '../../Services/JobSeekerSchedule/JobSeekerSchedule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const ScheduleScreen = () => {
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(1); // Default to Monday

  // Day names in Vietnamese (index matches JavaScript Date.getDay())
  const DAY_NAMES = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  
  // Day options for picker
  const DAY_OPTIONS = [
    { value: 1, label: 'Thứ 2', apiValue: 0 },    // Monday
    { value: 2, label: 'Thứ 3', apiValue: 1 },    // Tuesday  
    { value: 3, label: 'Thứ 4', apiValue: 2 },    // Wednesday
    { value: 4, label: 'Thứ 5', apiValue: 3 },    // Thursday
    { value: 5, label: 'Thứ 6', apiValue: 4 },    // Friday
    { value: 6, label: 'Thứ 7', apiValue: 5 },    // Saturday
    { value: 0, label: 'Chủ Nhật', apiValue: 6 },  // Sunday
  ];

  // Convert API day (0=Mon, 1=Tue, ..., 6=Sun) to JS day (0=Sun, 1=Mon, ..., 6=Sat)
  const apiDayToJsDay = useCallback((apiDay) => {
    return apiDay === 6 ? 0 : apiDay + 1;
  }, []);

  // Convert JS day (0=Sun, 1=Mon, ..., 6=Sat) to API day (0=Mon, 1=Tue, ..., 6=Sun)
  const jsDayToApiDay = useCallback((jsDay) => {
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  // Get a date for a specific day of current week
  const getDateForDayOfWeek = useCallback((dayOfWeek) => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysFromToday = dayOfWeek - currentDay;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysFromToday);
    targetDate.setHours(0, 0, 0, 0); // Reset time to midnight
    
    return targetDate;
  }, []);

  // Create datetime from date and time
  const createDateTime = useCallback((date, time) => {
    const result = new Date(date);
    result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return result;
  }, []);

  // Format time for API (HH:mm:ss)
  const formatTimeForApi = useCallback((date) => {
    return date.toTimeString().slice(0, 8);
  }, []);

  // Parse time string from API (HH:mm:ss) to Date object
  const parseTimeFromApi = useCallback((timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, []);

  // Load existing schedule from API
  const loadExistingSchedule = useCallback(async (jobSeekerId) => {
    try {
      const response = await JobSeekerScheduleService.getJobSeekerSchedule(jobSeekerId);
      
      if (response.success && response.data) {
        const loadedEvents = response.data.map(shift => {
          // Convert API day to JavaScript day
          const jsDay = apiDayToJsDay(shift.dayOfWeek);
          
          // Get the date for this day of current week
          const targetDate = getDateForDayOfWeek(jsDay);
          
          // Parse start and end times
          const startTimeObj = parseTimeFromApi(shift.startTime);
          const endTimeObj = parseTimeFromApi(shift.endTime);
          
          // Create full datetime objects
          const startDateTime = createDateTime(targetDate, startTimeObj);
          const endDateTime = createDateTime(targetDate, endTimeObj);
          
          return {
            id: shift.jobSeekerShiftId.toString(),
            title: `${DAY_NAMES[jsDay]} Shift`,
            start: startDateTime,
            end: endDateTime,
            dayOfWeek: jsDay,
            originalData: shift
          };
        });
        
        setEvents(loadedEvents);
      } else {
        Alert.alert('Lỗi', response.error || 'Không thể tải lịch trình');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải lịch trình');
      setEvents([]);
    }
  }, [apiDayToJsDay, getDateForDayOfWeek, parseTimeFromApi, createDateTime]);

  // Initialize schedule on component mount
  const initializeSchedule = useCallback(async () => {
    try {
      const jobSeekerId = await AsyncStorage.getItem('userId');
      if (!jobSeekerId) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để sử dụng tính năng này');
        return;
      }
      await loadExistingSchedule(jobSeekerId);
    } catch (error) {
      console.error('Error initializing schedule:', error);
    }
  }, [loadExistingSchedule]);

  useEffect(() => {
    initializeSchedule();
  }, [initializeSchedule]);

  // Open modal for creating/editing events
  const openEventModal = useCallback((event = null, date = null) => {
    if (event) {
      // Edit existing event
      setSelectedEvent(event);
      setStartTime(new Date(event.start));
      setEndTime(new Date(event.end));
      setSelectedDayOfWeek(event.dayOfWeek);
      setEditMode(true);
    } else {
      // Create new event
      const now = date ? new Date(date) : new Date();
      const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
      
      setSelectedEvent(null);
      setStartTime(now);
      setEndTime(defaultEnd);
      setSelectedDayOfWeek(date ? date.getDay() : 1); // Default to Monday if no date
      setEditMode(false);
    }
    setModalVisible(true);
  }, []);

  // Close modal and reset state
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedEvent(null);
    setSelectedDayOfWeek(1);
    setEditMode(false);
  }, []);

  // Save event to server
  const saveEvent = useCallback(async () => {
    if (startTime >= endTime) {
      Alert.alert('Lỗi', 'Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    try {
      const jobSeekerId = await AsyncStorage.getItem('userId');
      
      // Get the target date for the selected day
      const targetDate = getDateForDayOfWeek(selectedDayOfWeek);
      
      // Create new start and end times with selected day
      const newStartTime = createDateTime(targetDate, startTime);
      const newEndTime = createDateTime(targetDate, endTime);
      
      const newEvent = {
        id: editMode ? selectedEvent.id : Date.now().toString(),
        title: `${DAY_NAMES[selectedDayOfWeek]} Shift`,
        start: newStartTime,
        end: newEndTime,
        dayOfWeek: selectedDayOfWeek,
      };

      // Update local state first for immediate UI feedback
      if (editMode) {
        setEvents(prevEvents => prevEvents.map(event => 
          event.id === selectedEvent.id ? newEvent : event
        ));
      } else {
        setEvents(prevEvents => [...prevEvents, newEvent]);
      }

      closeModal();

      // Prepare data for server
      const updatedEvents = editMode 
        ? events.map(event => event.id === selectedEvent.id ? newEvent : event)
        : [...events, newEvent];

      const jobShifts = updatedEvents.map(event => ({
        dayOfWeek: jsDayToApiDay(event.dayOfWeek),
        startTime: formatTimeForApi(event.start),
        endTime: formatTimeForApi(event.end)
      }));

      const scheduleData = {
        jobSeekerId: parseInt(jobSeekerId),
        jobShifts
      };

      console.log('Sending to server:', scheduleData);

      const response = await JobSeekerScheduleService.updateJobSeekerSchedule(scheduleData);
      
      if (response.success) {
        await loadExistingSchedule(jobSeekerId);
        Alert.alert('Thành công', editMode ? 'Cập nhật lịch trình thành công' : 'Thêm lịch trình thành công');
      } else {
        // Revert local changes if server save failed
        if (editMode) {
          setEvents(prevEvents => prevEvents.map(event => 
            event.id === selectedEvent.id ? selectedEvent : event
          ));
        } else {
          setEvents(prevEvents => prevEvents.filter(event => event.id !== newEvent.id));
        }
        Alert.alert('Lỗi', response.error || 'Không thể lưu lịch trình');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi lưu lịch trình');
    }
  }, [startTime, endTime, selectedDayOfWeek, editMode, selectedEvent, closeModal, events, 
      loadExistingSchedule, getDateForDayOfWeek, createDateTime, jsDayToApiDay, formatTimeForApi]);

  // Delete event
  const deleteEvent = useCallback(async () => {
    if (!selectedEvent) return;

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa lịch trình này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const jobSeekerId = await AsyncStorage.getItem('userId');
              
              // Update local state first
              const updatedEvents = events.filter(event => event.id !== selectedEvent.id);
              setEvents(updatedEvents);
              closeModal();

              // Prepare data for server
              const jobShifts = updatedEvents.map(event => ({
                dayOfWeek: jsDayToApiDay(event.dayOfWeek),
                startTime: formatTimeForApi(event.start),
                endTime: formatTimeForApi(event.end)
              }));

              const scheduleData = {
                jobSeekerId: parseInt(jobSeekerId),
                jobShifts
              };

              const response = await JobSeekerScheduleService.updateJobSeekerSchedule(scheduleData);
              
              if (response.success) {
                await loadExistingSchedule(jobSeekerId);
                Alert.alert('Thành công', 'Xóa lịch trình thành công');
              } else {
                setEvents(events);
                Alert.alert('Lỗi', response.error || 'Không thể xóa lịch trình');
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              setEvents(events);
              Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa lịch trình');
            }
          }
        }
      ]
    );
  }, [selectedEvent, closeModal, events, loadExistingSchedule, jsDayToApiDay, formatTimeForApi]);

  // Time picker handlers
  const onStartTimeChange = useCallback((selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
      
      // Auto-adjust end time to be 1 hour after start time
      const newEndTime = new Date(selectedDate.getTime() + 60 * 60 * 1000);
      if (newEndTime > endTime) {
        setEndTime(newEndTime);
      }
    }
  }, [endTime]);

  const onEndTimeChange = useCallback((selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  }, []);

  // Format time for display
  const formatTimeDisplay = useCallback((date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, []);

  // Render day picker
  const renderDayPicker = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Chọn ngày trong tuần</Text>
      <View style={styles.dayPickerContainer}>
        {DAY_OPTIONS.map((day) => (
          <TouchableOpacity
            key={day.value}
            style={[
              styles.dayOption,
              selectedDayOfWeek === day.value && styles.selectedDayOption
            ]}
            onPress={() => setSelectedDayOfWeek(day.value)}
          >
            <Text style={[
              styles.dayOptionText,
              selectedDayOfWeek === day.value && styles.selectedDayOptionText
            ]}>
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch Trình Làm Việc</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => openEventModal()}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Calendar

        calendarContainerStyle={{height: 2100}}
        timezone="Asia/Ho_Chi_Minh"
        headerContainerStyle={{height: 50, backgroundColor: '#FF7345'}}
        hideNowIndicator={true}
        events={events}
        height={750}
        mode="week"
        scrollOffsetMinutes={480} 
        onPressEvent={openEventModal}
        onPressCell={openEventModal}
        eventCellStyle={styles.eventCell}
        headerContentStyle={styles.calendarHeader}
        bodyContainerStyle={styles.calendarBody}
      />

      {/* Event Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancelButton}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editMode ? 'Chỉnh Sửa' : 'Thêm'} Lịch Trình
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {renderDayPicker()}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thời gian bắt đầu</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTimeDisplay(startTime)}
                </Text>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thời gian kết thúc</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTimeDisplay(endTime)}
                </Text>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={saveEvent}
            >
              <Text style={styles.modalSaveButtonText}>
                {editMode ? 'Cập nhật lịch trình' : 'Lưu lịch trình'}
              </Text>
            </TouchableOpacity>

            {editMode && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={deleteEvent}
              >
                <Text style={styles.deleteButtonText}>Xóa Lịch Trình</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <DateTimePickerModal
            isVisible={showStartPicker}
            mode="time"
            date={startTime}
            onConfirm={onStartTimeChange}
            onCancel={() => setShowStartPicker(false)}
            display="spinner"
            textColor="#000"
          />

          <DateTimePickerModal
            isVisible={showEndPicker}
            mode="time"
            date={endTime}
            onConfirm={onEndTimeChange}
            onCancel={() => setShowEndPicker(false)}
            display="spinner"
            textColor="#000"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCell: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  calendarHeader: {
    backgroundColor: '#f8f9fa',
  },
  calendarBody: {
    backgroundColor: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginVertical: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayOption: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  selectedDayOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedDayOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ScheduleScreen;