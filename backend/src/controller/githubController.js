import { User } from "../model/userModel.js";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL ||
  "http://localhost:3000/api/github/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const githubFetch = async (path, token, options = {}) => {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "DevNotes-App",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
};

export const githubAuth = async (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(503).json({ message: "GitHub OAuth not configured" });
  }
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", CALLBACK_URL);
  url.searchParams.set("scope", "repo read:user");
  url.searchParams.set("state", String(req.user._id));
  return res.redirect(url.toString());
};

export const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/github?error=missing_code`);
    }
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect(`${FRONTEND_URL}/github?error=token_exchange`);
    }
    const profile = await githubFetch("/user", tokenData.access_token);
    const user = await User.findById(req.query.state);
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/github?error=no_user`);
    }
    user.githubAccessToken = tokenData.access_token;
    user.githubUsername = profile.login;
    await user.save();
    return res.redirect(`${FRONTEND_URL}/github?connected=1`);
  } catch (error) {
    return res.redirect(
      `${FRONTEND_URL}/github?error=${encodeURIComponent(error.message)}`
    );
  }
};

export const githubStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "+githubAccessToken githubUsername"
    );
    return res.status(200).json({
      connected: !!user?.githubAccessToken,
      username: user?.githubUsername || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const githubDisconnect = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.githubAccessToken = null;
    user.githubUsername = null;
    await user.save();
    return res.status(200).json({ message: "Disconnected" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listRepos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(400).json({ message: "GitHub not connected" });
    }
    const repos = await githubFetch(
      "/user/repos?per_page=50&sort=updated",
      user.githubAccessToken
    );
    return res.status(200).json({
      repos: repos.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const repoInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(400).json({ message: "GitHub not connected" });
    }
    const { owner, repo } = req.params;
    const info = await githubFetch(
      `/repos/${owner}/${repo}`,
      user.githubAccessToken
    );
    let languages = {};
    try {
      languages = await githubFetch(
        `/repos/${owner}/${repo}/languages`,
        user.githubAccessToken
      );
    } catch {}
    return res.status(200).json({ repo: info, languages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const generateReadme = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(400).json({ message: "GitHub not connected" });
    }
    const { owner, repo } = req.body || {};
    if (!owner || !repo) {
      return res.status(400).json({ message: "owner and repo are required" });
    }
    const info = await githubFetch(
      `/repos/${owner}/${repo}`,
      user.githubAccessToken
    );
    let languages = {};
    try {
      languages = await githubFetch(
        `/repos/${owner}/${repo}/languages`,
        user.githubAccessToken
      );
    } catch {}
    const langList = Object.keys(languages);
    const readme = `# ${info.name}

${info.description || "A project."}

## Features

- 

## Tech Stack

${langList.map((l) => `- ${l}`).join("\n") || "- "}

## Installation

\`\`\`bash
git clone ${info.clone_url}
cd ${info.name}
\`\`\`

## Usage

\`\`\`bash
# add usage instructions
\`\`\`

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

${info.license?.name || "MIT"}
`;
    return res.status(200).json({ readme, repo: info });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
