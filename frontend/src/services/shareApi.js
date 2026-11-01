import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export const createShare = async (id, { access, expiresAt }) => {
  const response = await api.post(`/notes/${id}/share`, { access, expiresAt });
  return response.data.share ?? response.data.data ?? response.data;
};

export const listShares = async (id) => {
  const response = await api.get(`/notes/${id}/shares`);
  return response.data.shares ?? response.data.data ?? response.data;
};

export const revokeShare = async (id) => {
  const response = await api.delete(`/shares/${id}`);
  return response.data;
};

export const viewShare = async (token) => {
  const response = await api.get(`/share/${token}`);
  return response.data;
};