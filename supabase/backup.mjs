// Project E.D.E.N. — backup de la base (esquema public) a JSON local. Sin dependencias (Node 22+).
//
//   SUPABASE_ACCESS_TOKEN=sbp_...  node supabase/backup.mjs            → backups/<fecha>/
//   SUPABASE_ACCESS_TOKEN=sbp_...  node supabase/backup.mjs --restore-sql backups/<fecha>
//
// - Exporta cada tabla de `public` (filas completas), las políticas RLS, los triggers y las funciones
//   a backups/<fecha>/ (*.json + manifest.json con conteos). backups/ está en .gitignore: contiene datos
//   de salud y el repo es público. Guardar la copia en un lugar privado.
// - No exporta auth.users (hashes de contraseñas): las cuentas demo se recrean con seed.sql.
// - --restore-sql genera restore.sql (NO lo ejecuta): reinserta filas borradas
//   (`on conflict (id) do nothing`, no pisa filas existentes). Revisarlo y correrlo en el SQL Editor.
// Usa la Management API con un token personal (sbp_) que vive solo en el entorno, nunca en el repo.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REF = process.env.SUPABASE_PROJECT_REF ?? "byztvpnhkzfetarkcrcu";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const args = process.argv.slice(2);

if (args[0] === "--restore-sql") {
  const dir = resolve(args[1] ?? "");
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const parts = ["-- restore.sql generado desde " + dir, "-- Reinserta filas faltantes; no modifica las existentes.", "begin;"];
  for (const t of manifest.tables) {
    const rows = JSON.parse(readFileSync(join(dir, `${t}.json`), "utf8"));
    if (!rows.length) continue;
    const json = JSON.stringify(rows).replace(/'/g, "''");
    parts.push(`insert into public.${t} overriding system value select * from json_populate_recordset(null::public.${t}, '${json}') on conflict do nothing;`);
  }
  parts.push("commit;");
  writeFileSync(join(dir, "restore.sql"), parts.join("\n") + "\n");
  console.log(`restore.sql escrito en ${dir} (revisar antes de ejecutar)`);
  process.exit(0);
}

if (!TOKEN) { console.error("Falta SUPABASE_ACCESS_TOKEN (token personal sbp_, solo en el entorno)."); process.exit(2); }
const sql = async (query) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`Management API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
};

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dir = resolve("backups", stamp);
mkdirSync(dir, { recursive: true });
const tables = (await sql("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1")).map((r) => r.table_name);
const counts = {};
for (const t of tables) {
  const [{ rows }] = await sql(`select coalesce(json_agg(x), '[]'::json) as rows from public."${t}" x`);
  writeFileSync(join(dir, `${t}.json`), JSON.stringify(rows, null, 2));
  counts[t] = rows.length;
}
writeFileSync(join(dir, "policies.json"), JSON.stringify(await sql("select tablename, policyname, roles::text, cmd, qual, with_check from pg_policies where schemaname='public' order by 1,2"), null, 2));
writeFileSync(join(dir, "triggers.json"), JSON.stringify(await sql("select tgrelid::regclass::text tabla, tgname, pg_get_triggerdef(oid) def from pg_trigger where not tgisinternal and tgrelid::regclass::text not like 'storage.%' and tgrelid::regclass::text not like 'realtime.%'"), null, 2));
writeFileSync(join(dir, "functions.json"), JSON.stringify(await sql("select p.proname, pg_get_functiondef(p.oid) def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'"), null, 2));
writeFileSync(join(dir, "manifest.json"), JSON.stringify({ project: REF, when: new Date().toISOString(), tables, counts }, null, 2));
console.log(`Backup en ${dir}`);
console.log(counts);
const all = readdirSync(resolve("backups")).filter((d) => existsSync(join("backups", d, "manifest.json")));
console.log(`${all.length} backup(s) en backups/`);
