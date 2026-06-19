import { Octokit } from "@octokit/rest";

export type GithubUploadParams = {
    owner: string;
    repo: string;
    branch?: string;
    path: string;
    token: string;
    contentBase64: string;
    message?: string;
    sha?: string;
};

export async function checkRepoWriteAccess(owner: string, repo: string, token: string) {
    const octokit = new Octokit({ auth: token });
    try {
        const me = await octokit.users.getAuthenticated();
        const p = await octokit.repos.getCollaboratorPermissionLevel({ owner, repo, username: me.data.login });
        const level = p.data.permission;
        const ok = level === "admin" || level === "write" || level === "maintain";
        return { ok, level };
    } catch (e: any) {
        const status = e?.status || e?.response?.status;
        return { ok: false, level: null, status };
    }
}

export async function uploadFileToGithub(params: GithubUploadParams) {
    const { owner, repo, branch = "main", path, token, contentBase64, message = `upload ${path}` } = params;
    const octokit = new Octokit({ auth: token });

    const access = await checkRepoWriteAccess(owner, repo, token);
    if (!access.ok) {
        const status = (access as any).status;
        const info = status === 403 ? "Token无写入权限或未授予该仓库" : "无法确认权限";
        throw new Error(info);
    }

    let existingSha: string | undefined = params.sha;
    if (!existingSha) {
        try {
            const res = await octokit.repos.getContent({ owner, repo, path, ref: branch });
            if (!Array.isArray(res.data) && res.data.type === "file") {
                existingSha = res.data.sha;
            }
        } catch (_) {
        }
    }

    const result = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        branch,
        message,
        content: contentBase64,
        sha: existingSha,
    });

    const webUrl = result.data.content?.html_url || `https://github.com/${owner}/${repo}/blob/${branch}/${path}`;
    const rawUrl = `https://github.com/${owner}/${repo}/raw/${branch}/${path}`;
    const gitUrl = result.data.content?.git_url || `https://api.github.com/repos/${owner}/${repo}/git/blobs/${result.data.content?.sha}`;

    return {
        webUrl,
        rawUrl,
        gitUrl,
        sha: result.data.content?.sha,
        path,
    };
}

export async function blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
}
