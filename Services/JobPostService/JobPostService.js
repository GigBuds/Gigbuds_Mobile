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
        districtCodeList,
        jobPositionId
    } = {}) {
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
            if (districtCodeList && Array.isArray(districtCodeList) && districtCodeList.length > 0) {
                params.append('districtCodeList', districtCodeList.join(','));
            }
            
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

    // Fixed method signature to accept jobSeekerId as a string parameter
    static async getRecommendedJobPosts(jobSeekerId, options = {}) {
        try {
            const {
                currentLocation = ' Quận 9, Thành phố Hồ Chí Minh',
                pageIndex = 0,
                pageSize = 10,
                includeScheduleMatching = true,
                includeDistanceCalculation = true
            } = options;

            const params = new URLSearchParams();
            
            // jobSeekerId is required
            if (!jobSeekerId) {
                throw new Error('jobSeekerId is required');
            }
            
            if (currentLocation) params.append('currentLocation', currentLocation);
            if (pageIndex !== undefined) params.append('pageIndex', pageIndex);
            if (pageSize !== undefined) params.append('pageSize', pageSize);
            if (includeScheduleMatching !== undefined) params.append('includeScheduleMatching', includeScheduleMatching);
            if (includeDistanceCalculation !== undefined) params.append('includeDistanceCalculation', includeDistanceCalculation);

            console.log('Recommendation API URL:', `job-posts/recommendations/${jobSeekerId}?${params.toString()}`);
            
            const response = await api.get(`job-posts/recommendations/${jobSeekerId}?${params.toString()}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        }
        catch (error) {
            console.error('Error in getRecommendedJobPosts:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy công việc gợi ý.",
                status: error.response?.status
            };
        }
    }
}

export default JobPostService;