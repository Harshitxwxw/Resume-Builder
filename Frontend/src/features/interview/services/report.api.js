import { createApiClient } from "../../../services/apiClient";

const api = createApiClient("/interview");

export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile, resumeData, resumeText }) => {
    const formData = new FormData();

    if (jobDescription) {
        formData.append("jobDescription", jobDescription);
        formData.append("job_description", jobDescription);
    }
    if (selfDescription) {
        formData.append("selfDescription", selfDescription);
        formData.append("self_description", selfDescription);
    }
    if (resumeFile) {
        formData.append("resume", resumeFile);
    }
    if (resumeData) {
        formData.append("resumeData", typeof resumeData === 'string' ? resumeData : JSON.stringify(resumeData));
    }
    if (resumeText) {
        formData.append("resumeText", resumeText);
    }
    
    const response = await api.post("/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response.data;
};

export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/report/${interviewId}`);
    return response.data;
};

export const getAllInterviewReports = async () => {
    const response = await api.get("/reports");
    return response.data;
};

export const toggleTrackReport = async (interviewId) => {
    const response = await api.patch(`/report/${interviewId}/track`);
    return response.data;
};
