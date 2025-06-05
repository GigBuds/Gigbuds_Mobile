import api from "../api";

class UploadFile {
    static async uploadFile(file) {
        try {
            if (!file) {
                throw new Error('File  are required');
            }

            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name
            });

            const response = await api.post(`files/upload/?folder=Files&fileType=JobAttachment`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in uploadFile:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi tải lên tệp.",
                status: error.response?.status
            };
        }
    }

    static async uploadMultipleFiles(files, path) {
        try {
            if (!files || files.length === 0 || !path) {
                throw new Error('Files and path are required');
            }

            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append(`files`, {
                    uri: file.uri,
                    type: file.type,
                    name: file.name
                });
            });

            const response = await api.post(`upload/multiple/${path}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in uploadMultipleFiles:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi tải lên nhiều tệp.",
                status: error.response?.status
            };
        }
    }

    static async deleteFile(fileName, path) {
        try {
            if (!fileName || !path) {
                throw new Error('File name and path are required');
            }

            const response = await api.delete(`upload/${path}/${fileName}`);

            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in deleteFile:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi xóa tệp.",
                status: error.response?.status
            };
        }
    }
}

export default UploadFile;