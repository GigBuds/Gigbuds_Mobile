import { View, Text } from "react-native";
import React from "react";
import { Calendar } from "react-native-big-calendar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const CalendarComp = ({ jobSchedule }) => {
    const userSchedule = [
        {
            dayOfWeek: 1, // Sunday
            startTime: "08:00",
            endTime: "16:00"
        },
 
        {
            dayOfWeek: 3, // Tuesday
            startTime: "08:00",
            endTime: "16:00"
        },
        {
            dayOfWeek: 4, // Wednesday
            startTime: "08:00",
            endTime: "16:00"
        },
        {
            dayOfWeek: 5, // Thursday
            startTime: "08:00",
            endTime: "16:00"
        },
        {
            dayOfWeek: 6, // Friday
            startTime: "08:00",
            endTime: "16:00"
        }
    ];

    const [calendarEvents, setCalendarEvents] = React.useState([]);

    // Function to check if two time periods overlap within 1 hour tolerance
    const checkTimeMatch = (userShift, jobShift) => {
        const parseTime = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes; // Convert to minutes
        };

        const userStart = parseTime(userShift.startTime);
        const userEnd = parseTime(userShift.endTime);
        const jobStart = parseTime(jobShift.startTime);
        const jobEnd = parseTime(jobShift.endTime);

        // Check if there's overlap within 1 hour (60 minutes) tolerance
        const tolerance = 60; // 1 hour in minutes
        
        // Check if job shift overlaps with user shift considering tolerance
        const jobStartWithTolerance = jobStart - tolerance;
        const jobEndWithTolerance = jobEnd + tolerance;
        const userStartWithTolerance = userStart - tolerance;
        const userEndWithTolerance = userEnd + tolerance;

        return (
            (jobStartWithTolerance <= userEnd && jobEndWithTolerance >= userStart) ||
            (userStartWithTolerance <= jobEnd && userEndWithTolerance >= jobStart)
        );
    };

    // Function to generate calendar events
    const generateCalendarEvents = (jobScheduleData) => {
        const events = [];
        const today = new Date();
        const weeksToShow = 4;

        for (let week = 0; week < weeksToShow; week++) {
            // Add user schedule events (blue) - only if no match
            userSchedule.forEach((userShift, userIndex) => {
                const { dayOfWeek, startTime, endTime } = userShift;
                
                const shiftDate = new Date(today);
                // Map custom dayOfWeek (1=Sunday, 2=Monday, etc.) to JavaScript (0=Sunday, 1=Monday, etc.)
                const targetDayOfWeek = dayOfWeek === 1 ? 0 : dayOfWeek - 1;
                const currentDayOfWeek = today.getDay();
                const daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7 + (week * 7);
                shiftDate.setDate(today.getDate() + daysToAdd);
                
                const [startHour, startMinute] = startTime.split(':').map(Number);
                const [endHour, endMinute] = endTime.split(':').map(Number);
                
                const startDateTime = new Date(shiftDate);
                startDateTime.setHours(startHour, startMinute, 0, 0);
                
                const endDateTime = new Date(shiftDate);
                endDateTime.setHours(endHour, endMinute, 0, 0);

                // Check if this user shift matches any job shift
                let hasMatch = false;
                if (jobScheduleData?.jobShifts) {
                    hasMatch = jobScheduleData.jobShifts.some(jobShift => 
                        jobShift.dayOfWeek === userShift.dayOfWeek && 
                        checkTimeMatch(userShift, jobShift)
                    );
                }

                // Only add user event if there's no match
                if (!hasMatch) {
                    const userEvent = {
                        title: `Khả dụng`,
                        start: startDateTime,
                        end: endDateTime,
                        summary: `User: ${startTime} - ${endTime}`,
                        color: '#007bff', // Blue for unmatched user shifts
                        type: 'user',
                    };
                    
                    events.push(userEvent);
                }
            });

            // Add job schedule events (red for unmatched, green for matched)
            if (jobScheduleData?.jobShifts) {
                jobScheduleData.jobShifts.forEach((jobShift, jobIndex) => {
                    const { dayOfWeek, startTime, endTime } = jobShift;
                    
                    const shiftDate = new Date(today);
                    // Map custom dayOfWeek (1=Sunday, 2=Monday, etc.) to JavaScript (0=Sunday, 1=Monday, etc.)
                    const targetDayOfWeek = dayOfWeek === 1 ? 0 : dayOfWeek - 1;
                    const currentDayOfWeek = today.getDay();
                    const daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7 + (week * 7);
                    shiftDate.setDate(today.getDate() + daysToAdd);
                    
                    const [startHour, startMinute] = startTime.split(':').map(Number);
                    const [endHour, endMinute] = endTime.split(':').map(Number);
                    
                    const startDateTime = new Date(shiftDate);
                    startDateTime.setHours(startHour, startMinute, 0, 0);
                    
                    const endDateTime = new Date(shiftDate);
                    endDateTime.setHours(endHour, endMinute, 0, 0);

                    // Check if this job shift matches any user shift
                    const hasMatch = userSchedule.some(userShift => 
                        userShift.dayOfWeek === jobShift.dayOfWeek && 
                        checkTimeMatch(userShift, jobShift)
                    );

                    const jobEvent = {
                        title: hasMatch ? `Ca ${jobIndex + 1} (Khớp)` : `Ca ${jobIndex + 1} (Yêu cầu)`,
                        start: startDateTime,
                        end: endDateTime,
                        summary: `Job: ${startTime} - ${endTime}`,
                        color: hasMatch ? '#28a745' : '#dc3545', // Green if match, red if not
                        type: hasMatch ? 'match' : 'job',
                    };
                    
                    events.push(jobEvent);
                });
            }
        }
        
        return events;
    };

    React.useEffect(() => {
        const events = generateCalendarEvents(jobSchedule);
        setCalendarEvents(events);
        console.log("Generated events:", events);
    }, [jobSchedule]);

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

            <GestureHandlerRootView style={{ flex: 1, height: 600 }}>
                <Calendar 
                    events={calendarEvents} 
                    height={400}
                    width={100}
                    mode="week"
                    scrollOffsetMinutes={280} 
                    date={new Date()}
                    swipeEnabled={true}
                    showTime={true}
                    hourRowHeight={40}
                    eventCellStyle={(event) => ({
                        backgroundColor: event.color || '#2558B6',
                        borderRadius: 5,
                        opacity: event.type === 'match' ? 1 : 0.8,
                    })}
                />
            </GestureHandlerRootView>
        </View>
    );
};

const styles = {
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
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