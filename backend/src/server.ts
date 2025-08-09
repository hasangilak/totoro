import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { WebSocketServer } from "ws";
import chokidar from "chokidar";
import { z } from "zod";
import simpleGit, { SimpleGit } from "simple-git";
import { exec as _exec } from "child_process";
import { promisify } from "util";

const exec = promisify(_exec);

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"], credentials: false }));
app.use(express.json({ limit: "10mb" }));

const WORKSPACE = path.resolve(process.env.WORKSPACE_DIR ?? process.cwd());
const git: SimpleGit = simpleGit(WORKSPACE);
(async () => {
  const isRepo = await git.checkIsRepo();
  if (!isRepo) console.warn(`[git] ${WORKSPACE} is not a git repo`);
})();

function safeResolve(p: string) {
  const resolved = path.resolve(WORKSPACE, "." + p);
  if (!resolved.startsWith(WORKSPACE)) throw new Error("Path outside workspace");
  return resolved;
}

// ---------- FS TREE ----------
export type FileNode =
  | { type: "file"; name: string; path: string }
  | { type: "dir"; name: string; path: string; children: FileNode[] };

async function readTree(dirAbs: string, urlPath: string = "/"): Promise<FileNode> {
  const entries = await fs.readdir(dirAbs, { withFileTypes: true });
  const children: FileNode[] = [];
  for (const e of entries) {
    if (["node_modules", ".git", "dist", "build"].includes(e.name)) continue;
    const childAbs = path.join(dirAbs, e.name);
    const childUrlPath = path.posix.join(urlPath, e.name);
    if (e.isDirectory()) children.push(await readTree(childAbs, childUrlPath));
    else if (e.isFile()) children.push({ type: "file", name: e.name, path: childUrlPath });
  }
  return { type: "dir", name: path.basename(dirAbs) || "project", path: "/", children };
}

app.get("/api/fs/tree", async (_req, res) => {
  try { res.json(await readTree(WORKSPACE, "/")); } catch (e:any) { res.status(500).json({ error: e.message }); }
});

const getFileSchema = z.object({ path: z.string().startsWith("/") });
app.get("/api/fs/file", async (req, res) => {
  try {
    const { path: p } = getFileSchema.parse(req.query);
    const abs = safeResolve(p);
    if (!existsSync(abs)) return res.status(404).json({ error: "Not found" });
    const buf = await fs.readFile(abs);
    res.type("text/plain").send(buf.toString("utf8"));
  } catch (e:any) { res.status(400).json({ error: e.message }); }
});

const putFileSchema = z.object({ path: z.string().startsWith("/"), content: z.string() });
app.put("/api/fs/file", async (req, res) => {
  try {
    const { path: p, content } = putFileSchema.parse(req.body);
    const abs = safeResolve(p);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
    res.json({ ok: true });
    broadcast({ type: "fs:change", path: p });
  } catch (e:any) { res.status(400).json({ error: e.message }); }
});

// ---------- SEARCH (experimental) ----------
const searchSchema = z.object({ q: z.string().min(1), globs: z.string().optional(), maxResults: z.coerce.number().optional() });
app.get("/api/search", async (req, res) => {
  try {
    const { q, globs, maxResults = 200 } = searchSchema.parse(req.query);
    // Try ripgrep if available for speed
    try {
      const globArgs = globs ? globs.split(",").flatMap(g => ["-g", g]) : [];
      const cmd = ["rg", "--json", "--max-count=1", "--no-ignore", ...globArgs, q, "."].join(" ");
      const { stdout } = await exec(cmd, { cwd: WORKSPACE });
      const lines = stdout.trim().split(/\r?\n/);
      const results: any[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.type === "match") {
            results.push({ path: "/" + obj.data.path.text.replaceAll("\\\\","/"), line: obj.data.lines.text.trim() });
            if (results.length >= maxResults) break;
          }
        } catch {}
      }
      return res.json({ engine: "ripgrep", results });
    } catch {
      // Fallback: naive scan (small projects only)
      const results: any[] = [];
      async function walk(abs: string, rel: string) {
        const entries = await fs.readdir(abs, { withFileTypes: true });
        for (const e of entries) {
          if (["node_modules", ".git", "dist", "build"].includes(e.name)) continue;
          const a = path.join(abs, e.name); const r = path.posix.join(rel, e.name);
          if (e.isDirectory()) await walk(a, r);
          else if (e.isFile()) {
            const text = await fs.readFile(a, "utf8").catch(() => "");
            if (text.toLowerCase().includes(q.toLowerCase())) results.push({ path: "/" + r, line: "…" });
            if (results.length >= maxResults) return;
          }
        }
      }
      await walk(WORKSPACE, "");
      return res.json({ engine: "fallback", results });
    }
  } catch (e:any) { res.status(400).json({ error: e.message }); }
});

// ---------- GIT ----------
app.get("/api/git/status", async (_req, res) => {
  try {
    const s = await git.status();
    res.json({ branch: s.current, ahead: s.ahead, behind: s.behind, changed: s.files.map(f => ({ path: "/" + f.path.replaceAll("\\\\","/"), index: f.index, working_dir: f.working_dir })) });
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/git/summary", async (_req, res) => {
  try {
    const log = await git.log({ maxCount: 1 });
    const s = await git.status();
    res.json({ branch: s.current, ahead: s.ahead, behind: s.behind, last: log.latest });
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/git/file-versions", async (req, res) => {
  try {
    const p = String(req.query.path); safeResolve(p); const rel = p.slice(1);
    const head = await git.show([`HEAD:${rel}`]).catch(() => "");
    const working = await fs.readFile(safeResolve(p), "utf8").catch(() => "");
    const { stdout } = await exec(`git -C "${WORKSPACE}" show :${rel}`).catch(() => ({ stdout: "" }));
    const index = stdout; res.json({ head, index, working });
  } catch (e:any) { res.status(400).json({ error: e.message }); }
});

app.post("/api/git/stage", async (req, res) => {
  try { await git.add([req.body.path.slice(1)]); res.json({ ok:true }); broadcast({ type:"git" }); }
  catch(e:any){ res.status(400).json({ error:e.message }); }
});
app.post("/api/git/unstage", async (req, res) => {
  try { await git.reset(["HEAD", "--", req.body.path.slice(1)]); res.json({ ok:true }); broadcast({ type:"git" }); }
  catch(e:any){ res.status(400).json({ error:e.message }); }
});
app.post("/api/git/discard", async (req, res) => {
  try { await exec(`git -C "${WORKSPACE}" restore --source=HEAD -- "${req.body.path.slice(1)}"`); res.json({ ok:true }); broadcast({ type:"git" }); }
  catch(e:any){ res.status(400).json({ error: e.message }); }
});

// New bulk actions
app.post("/api/git/stage-all", async (_req, res) => {
  try { await git.add(["-A"]); res.json({ ok:true }); broadcast({ type:"git" }); }
  catch(e:any){ res.status(400).json({ error:e.message }); }
});
app.post("/api/git/unstage-all", async (_req, res) => {
  try { await git.reset(["HEAD"]); res.json({ ok:true }); broadcast({ type:"git" }); }
  catch(e:any){ res.status(400).json({ error:e.message }); }
});
app.post("/api/git/discard-all", async (_req, res) => {
  try { await exec(`git -C "${WORKSPACE}" restore --source=HEAD --worktree -- .`); res.json({ ok:true }); broadcast({ type:"git" }); }
  catch(e:any){ res.status(400).json({ error:e.message }); }
});

app.post("/api/git/commit", async (req, res) => {
  try { const { message } = req.body as { message: string }; const r = await git.commit(message); res.json({ ok:true, commit: r.commit }); broadcast({ type:"git" }); }
  catch(e:any){ res.status(400).json({ error: e.message }); }
});

// ---------- HTTP & WS ----------
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => { console.log(`FS/Git API on http://localhost:${port} (root: ${WORKSPACE})`); });

const wss = new WebSocketServer({ server, path: "/ws" });
const watcher = chokidar.watch(WORKSPACE, { ignored: /(^|[\/])\.(git|cache)|node_modules|dist|build/, ignoreInitial: true });
function broadcast(msg: unknown) { const data = JSON.stringify(msg); wss.clients.forEach((c: any) => (c.readyState === 1) && c.send(data)); }
watcher
  .on("add", () => broadcast({ type: "fs:tree" }))
  .on("addDir", () => broadcast({ type: "fs:tree" }))
  .on("unlink", () => broadcast({ type: "fs:tree" }))
  .on("unlinkDir", () => broadcast({ type: "fs:tree" }))
  .on("change", (abs) => broadcast({ type: "fs:change", path: abs.replace(WORKSPACE, "") || "/" }));
