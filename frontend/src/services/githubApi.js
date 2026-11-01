import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export const githubStatus = async () => {
  const response = await api.get("/github/status");
  return response.data;
};

export const githubDisconnect = async () => {
  const response = await api.post("/github/disconnect");
  return response.data;
};

export const listRepos = async () => {
  const response = await api.get("/github/repos");
  return response.data.repos ?? response.data.data ?? response.data;
};

export const repoInfo = async (owner, repo) => {
  const response = await api.get(`/github/repo/${owner}/${repo}`);
  return response.data;
};

export const generateReadme = async (owner, repo) => {
  const response = await api.post("/github/generate-readme", { owner, repo });
  return response.data;
};