import api from "../api";

class JobPostService {

    static async searchJobPosts({
        companyName,
        jobName,
        salaryFrom,
        salaryTo,
        isMale,
        jobTimeFrom,
        jobTimeTo,
        salaryUnit,
        jobPositionId
    } = {}) {  // Add default empty object
        try {
            const params = new URLSearchParams();
            
            if (companyName) params.append('companyName', companyName);
            if (jobName) params.append('jobName', jobName);
            if (salaryFrom) params.append('salaryFrom', salaryFrom);
            if (salaryTo) params.append('salaryTo', salaryTo);
            if (isMale !== undefined) params.append('isMale', isMale);
            if (jobTimeFrom) params.append('jobTimeFrom', jobTimeFrom);
            if (jobTimeTo) params.append('jobTimeTo', jobTimeTo);
            if (salaryUnit) params.append('salaryUnit', salaryUnit);
            if (jobPositionId) params.append('jobPositionId', jobPositionId);
            
            const response = await api.get(`job-posts/search?${params.toString()}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || "Đã xảy ra lỗi khi tìm kiếm công việc.",
                status: error.response?.status
            };
        }
    }
}

export default JobPostService;