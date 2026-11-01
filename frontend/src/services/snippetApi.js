import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export const getSnippets = async () => {
  const response = await api.get("/snippets");
  return response.data.snippets ?? response.data.data ?? response.data;
};

export const createSnippet = async (snippet) => {
  const response = await api.post("/snippets", snippet);
  return response.data.snippet ?? response.data.data ?? response.data;
};

export const updateSnippet = async (id, snippet) => {
  const response = await api.put(`/snippets/${id}`, snippet);
  return response.data.snippet ?? response.data.data ?? response.data;
};

export const deleteSnippet = async (id) => {
  const response = await api.delete(`/snippets/${id}`);
  return response.data;
};