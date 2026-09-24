import "server-only";
import { githubEnv } from "./env";

const API = "https://api.github.com";

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export class ConflictError extends Error {}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = githubEnv();
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      message = ((await res.json()) as { message?: string }).message ?? message;
    } catch {}
    if (res.status === 403) {
      // 어느 repo에 거부됐는지 보여야 "설정이 엉뚱한 repo를 가리키는" 경우를 바로 알아챈다
      const { owner, repo } = githubEnv();
      message += ` — ${owner}/${repo}에 쓰기 권한이 없어요. 토큰의 Repository access와 GITHUB_REPO를 확인하세요.`;
    }
    throw new GitHubError(res.status, `GitHub ${res.status}: ${message}`);
  }
  return res.json() as Promise<T>;
}

// ---------- 읽기: GraphQL 한 번으로 컬렉션 폴더 전체 ----------

type TreeEntry = {
  name: string;
  type: "blob" | "tree";
  object: { text?: string | null } | null;
};

export type RepoSnapshot = {
  commitSha: string | null;
  dirs: Record<string, { name: string; text: string }[]>; // 폴더 → 바로 아래 텍스트 파일들
};

export async function readDirs(dirs: string[]): Promise<RepoSnapshot> {
  const { owner, repo, branch } = githubEnv();
  // 폴더마다 별칭(d0, d1, ...)을 붙여 한 번에 요청
  const fields = dirs
    .map(
      (_, i) =>
        `d${i}: object(expression: $e${i}) { ... on Tree { entries { name type object { ... on Blob { text } } } } }`,
    )
    .join("\n");
  const query = `
    query($owner: String!, $name: String!, $qualifiedRef: String!, ${dirs.map((_, i) => `$e${i}: String!`).join(", ")}) {
      repository(owner: $owner, name: $name) {
        ref(qualifiedName: $qualifiedRef) { target { oid } }
        ${fields}
      }
    }`;
  const variables: Record<string, string> = { owner, name: repo, qualifiedRef: `refs/heads/${branch}` };
  dirs.forEach((dir, i) => (variables[`e${i}`] = `${branch}:${dir}`));

  const data = await gh<{
    data?: { repository: ({ ref: { target: { oid: string } } | null } & Record<string, unknown>) | null };
    errors?: { message: string }[];
  }>("/graphql", { method: "POST", body: JSON.stringify({ query, variables }) });
  if (data.errors?.length) throw new GitHubError(400, data.errors[0].message);
  const repository = data.data?.repository;
  if (!repository) throw new GitHubError(404, `${owner}/${repo} 저장소를 찾을 수 없습니다.`);

  const result: RepoSnapshot["dirs"] = {};
  dirs.forEach((dir, i) => {
    const tree = repository[`d${i}`] as { entries: TreeEntry[] } | null;
    result[dir] = (tree?.entries ?? [])
      .filter((e) => e.type === "blob" && typeof e.object?.text === "string")
      .map((e) => ({ name: e.name, text: e.object!.text! }));
  });
  return { commitSha: repository.ref?.target.oid ?? null, dirs: result };
}

export async function readTextFile(path: string, ref: string): Promise<string | null> {
  const { owner, repo } = githubEnv();
  try {
    const file = await gh<{ content: string; encoding: string }>(
      `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${ref}`,
    );
    return Buffer.from(file.content, "base64").toString("utf8");
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

export async function listDir(path: string, ref: string): Promise<string[]> {
  const { owner, repo } = githubEnv();
  try {
    const entries = await gh<{ name: string; type: string }[]>(
      `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${ref}`,
    );
    return Array.isArray(entries) ? entries.filter((e) => e.type === "file").map((e) => e.name) : [];
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return [];
    throw e;
  }
}

// 커밋 없이 blob만 만든다. 이미지를 넣는 즉시 올려두고, 저장할 때 커밋 하나로 묶는다.
// (Vercel 요청 본문 4.5MB 한도를 이미지 1장 단위로 쪼개는 효과)
export async function createBlob(base64: string): Promise<string> {
  const { owner, repo } = githubEnv();
  const blob = await gh<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: base64, encoding: "base64" }),
  });
  return blob.sha;
}

// ---------- 쓰기: Git Data API로 여러 파일을 커밋 하나에 ----------

export type CommitFile = { path: string } & (
  | { text: string }
  | { base64: string }
  | { sha: string } // 미리 만들어 둔 blob
  | { delete: true }
);

type Prepare = (ctx: { headSha: string }) => Promise<CommitFile[]>;

/**
 * prepare는 현재 HEAD를 기준으로 커밋할 파일 목록을 만든다(존재 확인·기존 내용 병합 등).
 * 그 사이에 다른 커밋이 끼어들어 fast-forward가 실패하면 한 번 더 시도한다.
 */
export async function commitFiles(message: string, prepare: Prepare): Promise<string> {
  const { owner, repo, branch } = githubEnv();
  const base = `/repos/${owner}/${repo}/git`;

  for (let attempt = 0; ; attempt++) {
    const ref = await gh<{ object: { sha: string } }>(`${base}/ref/heads/${encodeURIComponent(branch)}`);
    const headSha = ref.object.sha;

    const [headCommit, files] = await Promise.all([
      gh<{ tree: { sha: string } }>(`${base}/commits/${headSha}`),
      prepare({ headSha }),
    ]);

    const entries = await Promise.all(
      files.map(async (f) => {
        if ("text" in f) return { path: f.path, mode: "100644", type: "blob", content: f.text };
        if ("sha" in f) return { path: f.path, mode: "100644", type: "blob", sha: f.sha };
        if ("delete" in f) return { path: f.path, mode: "100644", type: "blob", sha: null };
        const blob = await gh<{ sha: string }>(`${base}/blobs`, {
          method: "POST",
          body: JSON.stringify({ content: f.base64, encoding: "base64" }),
        });
        return { path: f.path, mode: "100644", type: "blob", sha: blob.sha };
      }),
    );

    const tree = await gh<{ sha: string }>(`${base}/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: entries }),
    });
    const commit = await gh<{ sha: string }>(`${base}/commits`, {
      method: "POST",
      body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
    });

    try {
      await gh(`${base}/refs/heads/${encodeURIComponent(branch)}`, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      });
      return commit.sha;
    } catch (e) {
      if (attempt === 0 && e instanceof GitHubError && e.status === 422) continue;
      throw e;
    }
  }
}
