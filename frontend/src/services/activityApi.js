import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export const logActivity = async (action, noteId = null, metadata = {}) => {
  const response = await api.post("/activity", { action, noteId, metadata });
  return response.data;
};

export const getActivities = async () => {
  const response = await api.get("/activity");
  return response.data.activities ?? response.data.data ?? response.data;
};