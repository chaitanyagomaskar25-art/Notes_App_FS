import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export const getFolders = async () => {
  const response = await api.get("/folders");
  return response.data.folders ?? response.data.data ?? response.data;
};

export const createFolder = async (name) => {
  const response = await api.post("/folders", { name });
  return response.data.folder ?? response.data.data ?? response.data;
};

export const renameFolder = async (id, name) => {
  const response = await api.put(`/folders/${id}`, { name });
  return response.data.folder ?? response.data.data ?? response.data;
};

export const deleteFolder = async (id) => {
  const response = await api.delete(`/folders/${id}`);
  return response.data;
};