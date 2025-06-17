import api from "../api";

class JobSeekerScheduleService {
    static async getJobSeekerSchedule(jobSeekerId) {
        try {
            if (!jobSeekerId) {
                throw new Error('Job seeker ID is required');
            }

            const response = await api.get(`job-seeker-shifts/${jobSeekerId}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in getJobSeekerSchedule:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy lịch làm việc của người tìm việc.",
                status: error.response?.status
            };
        }
    }

    static async updateJobSeekerSchedule(scheduleData) {
        try {
            if (!scheduleData) {
                throw new Error('schedule data are required');
            }

            const response = await api.put(`job-seeker-shifts/update-job-shifts`, scheduleData);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in updateJobSeekerSchedule:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi cập nhật lịch làm việc của người tìm việc.",
                status: error.response?.status
            };
        }
    }
}

export default JobSeekerScheduleService;