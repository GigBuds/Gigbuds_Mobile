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
    

    static async checkMembership(accountId) {
        try {
            if (!accountId) {
                throw new Error("Account ID is required");
            }
            const response = await api.get(`member-ships/all/${accountId}`);
            return {
                success: true,
                data: response.data,
                status: response.status,
            };
        } catch (error) {
            console.error("Error in checkMembership:", error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi kiểm tra thành viên.",
                status: error.response?.status,
            };
        }
    }

    static async revokeMembership(accountId, membershipId) {
        try {
            if (!accountId || !membershipId) {
                throw new Error("Account ID and Membership ID are required");
            }
            const response = await api.delete(`member-ships/revoke/${accountId}/${membershipId}`);
            return {
                success: true,
                data: response.data,
                status: response.status,
            };
        } catch (error) {
            console.error("Error in revokeMembership:", error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi thu hồi thành viên.",
                status: error.response?.status,
            };
        }
        }
    }
export default MembershipService;