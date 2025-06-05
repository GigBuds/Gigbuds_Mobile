import { View, Text } from "react-native";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar } from "react-native-big-calendar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const CalendarComp = ({ jobSchedule }) => {
    // Memoize user schedule to prevent unnecessary recalculations
    const userSchedule = useMemo(() => [
        { dayOfWeek: 1, startTime: "08:00", endTime: "16:00" }, // Sunday
        { dayOfWeek: 3, startTime: "08:00", endTime: "16:00" }, // Tuesday
        { dayOfWeek: 4, startTime: "08:00", endTime: "16:00" }, // Wednesday
        { dayOfWeek: 5, startTime: "08:00", endTime: "16:00" }, // Thursday
        { dayOfWeek: 6, startTime: "08:00", endTime: "16:00" }  // Friday
    ], []);

    const [calendarEvents, setCalendarEvents] = useState([]);

    // Memoized time parsing function
    const parseTime = useCallback((timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }, []);

    // Optimized time overlap checking with early returns
    const checkTimeMatch = useCallback((userShift, jobShift) => {
        const userStart = parseTime(userShift.startTime);
        const userEnd = parseTime(userShift.endTime);
        const jobStart = parseTime(jobShift.startTime);
        const jobEnd = parseTime(jobShift.endTime);

        const tolerance = 60; // 1 hour in minutes
        
        // Simple overlap check with tolerance
        return (
            jobStart - tolerance <= userEnd && 
            jobEnd + tolerance >= userStart
        );
    }, [parseTime]);

    // Create a lookup map for faster matching
    const createMatchLookup = useCallback((jobShifts) => {
        if (!jobShifts) return new Map();
        
        const matchMap = new Map();
        
        jobShifts.forEach((jobShift, jobIndex) => {
            userSchedule.forEach((userShift, userIndex) => {
                if (userShift.dayOfWeek === jobShift.dayOfWeek && 
                    checkTimeMatch(userShift, jobShift)) {
                    
                    const userKey = `user-${userShift.dayOfWeek}-${userIndex}`;
                    const jobKey = `job-${jobShift.dayOfWeek}-${jobIndex}`;
                    
                    matchMap.set(userKey, true);
                    matchMap.set(jobKey, true);
                }
            });
        });
        
        return matchMap;
    }, [userSchedule, checkTimeMatch]);

    // Optimized date calculation
    const getShiftDate = useCallback((dayOfWeek, week, baseDate) => {
        const targetDayOfWeek = dayOfWeek === 1 ? 0 : dayOfWeek - 1;
        const currentDayOfWeek = baseDate.getDay();
        const daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7 + (week * 7);
        
        const shiftDate = new Date(baseDate);
        shiftDate.setDate(baseDate.getDate() + daysToAdd);
        return shiftDate;
    }, []);

    // Create event object factory
    const createEvent = useCallback((type, shift, shiftDate, index, hasMatch) => {
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const [endHour, endMinute] = shift.endTime.split(':').map(Number);
        
        const startDateTime = new Date(shiftDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        const endDateTime = new Date(shiftDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        const eventConfig = {
            user: {
                title: 'Khả dụng',
                color: '#007bff',
                type: 'user'
            },
            job: {
                title: `Ca ${index + 1} (Yêu cầu)`,
                color: '#dc3545',
                type: 'job'
            },
            match: {
                title: `Ca ${index + 1} (Khớp)`,
                color: '#28a745',
                type: 'match'
            }
        };

        const config = hasMatch && type === 'job' ? eventConfig.match : eventConfig[type];

        return {
            title: config.title,
            start: startDateTime,
            end: endDateTime,
            summary: `${type}: ${shift.startTime} - ${shift.endTime}`,
            color: config.color,
            type: config.type,
        };
    }, []);

    // Optimized event generation
    const generateCalendarEvents = useCallback((jobScheduleData) => {
        const events = [];
        const today = new Date();
        const weeksToShow = 4;
        const jobShifts = jobScheduleData?.jobShifts || [];
        
        // Create match lookup once
        const matchLookup = createMatchLookup(jobShifts);

        for (let week = 0; week < weeksToShow; week++) {
            // Generate user events
            userSchedule.forEach((userShift, userIndex) => {
                const userKey = `user-${userShift.dayOfWeek}-${userIndex}`;
                const hasMatch = matchLookup.has(userKey);
                
                // Only add user event if no match
                if (!hasMatch) {
                    const shiftDate = getShiftDate(userShift.dayOfWeek, week, today);
                    const event = createEvent('user', userShift, shiftDate, userIndex, false);
                    events.push(event);
                }
            });

            // Generate job events
            jobShifts.forEach((jobShift, jobIndex) => {
                const jobKey = `job-${jobShift.dayOfWeek}-${jobIndex}`;
                const hasMatch = matchLookup.has(jobKey);
                
                const shiftDate = getShiftDate(jobShift.dayOfWeek, week, today);
                const event = createEvent('job', jobShift, shiftDate, jobIndex, hasMatch);
                events.push(event);
            });
        }
        
        return events;
    }, [userSchedule, createMatchLookup, getShiftDate, createEvent]);

    // Memoize events to prevent unnecessary recalculations
    const memoizedEvents = useMemo(() => {
        return generateCalendarEvents(jobSchedule);
    }, [jobSchedule, generateCalendarEvents]);

    useEffect(() => {
        setCalendarEvents(memoizedEvents);
    }, [memoizedEvents]);

    // Memoize event cell style function
    const eventCellStyle = useCallback((event) => ({
        backgroundColor: event.color || '#2558B6',
        borderRadius: 5,
        opacity: event.type === 'match' ? 1 : 0.8,
    }), []);

    return (
        <View>
            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#007bff' }]} />
                    <Text style={styles.legendText}>Lịch của bạn</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#dc3545' }]} />
                    <Text style={styles.legendText}>Lịch công việc</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#28a745' }]} />
                    <Text style={styles.legendText}>Khớp lịch (±1h)</Text>
                </View>
            </View>

            <GestureHandlerRootView style={{ flex: 1, height: 400, backgroundColor: '#fff', borderRadius: 15 }}>
                <Calendar 
                    headerContainerStyle={{height:60 }}
                    events={calendarEvents} 
                    height={400}
                    timezone="Asia/Ho_Chi_Minh"
                    mode="week"
                    scrollOffsetMinutes={280} 
                    date={new Date()}
                    swipeEnabled={true}
                    showTime={true}
                    hourRowHeight={40}
                    eventCellStyle={eventCellStyle}
                />
            </GestureHandlerRootView>
        </View>
    );
};

// Memoize styles object
const styles = {
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        borderBottomWidth: 1,
        borderColor: '#FF7345',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 5,
    },
    legendText: {
        fontSize: 12,
        color: '#333',
    },
};

export default CalendarComp;