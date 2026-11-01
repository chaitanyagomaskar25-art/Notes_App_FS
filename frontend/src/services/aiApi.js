import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export const aiAssist = async (action, text, title = "") => {
  const response = await api.post("/ai/assist", { action, text, title });
  return response.data;
};