
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          "http://localhost:3000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const getNotes = async () => {
  const response = await api.get("/notes");
  return response.data.notes ?? response.data.data ?? response.data;
};

export const createNote = async (note) => {
  const response = await api.post("/notes", note);
  return response.data.note ?? response.data.data ?? response.data;
};

export const updateNote = async (id, note) => {
  const response = await api.put(`/notes/${id}`, note);
  return response.data.note ?? response.data.data ?? response.data;
};

export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`);
  return response.data;
};

export const restoreNote = async (id) => {
  const response = await api.post(`/notes/${id}/restore`);
  return response.data.note ?? response.data.data ?? response.data;
};

export const permanentDeleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}/permanent`);
  return response.data;
};

export const emptyTrash = async () => {
  const response = await api.delete("/notes/trash/empty");
  return response.data;
};

export const updateCollaborators = async (id, collaborators) => {
  const response = await api.put(`/notes/${id}/collaborators`, {
    collaborators,
  });

  return response.data;
};

export const getVersions = async (id) => {
  const response = await api.get(`/notes/${id}/versions`);
  return response.data.versions ?? response.data.data ?? response.data;
};

export const restoreVersion = async (id, versionId) => {
  const response = await api.post(`/notes/${id}/versions/${versionId}/restore`);
  return response.data.note ?? response.data.data ?? response.data;
};
