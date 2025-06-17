import api from "../api";

class MembershipService {
    static async getMemberships() {
        try {
        const response = await api.get("member-ships/all");
        return {
            success: true,
            data: response.data,
            status: response.status,
        };
        } catch (error) {
        console.error("Error in getMemberships:", error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy danh sách thành viên.",
            status: error.response?.status,
        };
        }
    }
    
    static async getMembershipById(id) {
        try {
        if (!id) {
            throw new Error("Membership ID is required");
        }
        const response = await api.get(`memberships/${id}`);
        return {
            success: true,
            data: response.data,
            status: response.status,
        };
        } catch (error) {
        console.error("Error in getMembershipById:", error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy thông tin thành viên.",
            status: error.response?.status,
        };
        }
    }
    }
export default MembershipService;