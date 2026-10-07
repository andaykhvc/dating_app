import { test } from "node:test";
import assert from "node:assert/strict";
import { saveInterests, saveLanguages } from "../src/features/profile/saveLists.ts";

type Call = { op: string; table: string; detail: unknown };

/** Records every write; `failOp` makes that operation come back with an error. */
function fakeSupabase(failOp?: string) {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const filters: unknown[] = [];
      const finish = (op: string, detail: unknown) => {
        calls.push({ op, table, detail });
        const result = { error: op === failOp ? { message: `${op} failed` } : null };
        return result;
      };
      const chain = {
        eq(column: string, value: unknown) { filters.push(["eq", column, value]); return chain; },
        neq(column: string, value: unknown) { filters.push(["neq", column, value]); return chain; },
        not(column: string, operator: string, value: unknown) {
          filters.push(["not", column, operator, value]);
          return chain;
        },
        then(resolve: (r: unknown) => unknown) {
          return Promise.resolve(finish("delete", filters)).then(resolve);
        },
      };
      return {
        upsert: async (rows: unknown, options: unknown) => finish("upsert", { rows, options }),
        delete: () => chain,
      };
    },
  };
  return { client: client as never, calls };
}

test("languages: the new pair is written before anything is removed", async () => {
  const { client, calls } = fakeSupabase();
  const error = await saveLanguages(client, "u1", { native: "es", learning: "de", level: "B1" });

  assert.equal(error, null);
  assert.deepEqual(calls.map((c) => c.op), ["upsert", "delete", "delete"]);
  assert.deepEqual((calls[0].detail as { options: unknown }).options, {
    onConflict: "user_id,language_code,role",
  });
  // Only rows that are no longer wanted go: same role, different language.
  assert.deepEqual(calls[1].detail, [["eq", "user_id", "u1"], ["eq", "role", "native"], ["neq", "language_code", "es"]]);
  assert.deepEqual(calls[2].detail, [["eq", "user_id", "u1"], ["eq", "role", "learning"], ["neq", "language_code", "de"]]);
});

test("languages: a failed write deletes nothing, so the old languages survive", async () => {
  const { client, calls } = fakeSupabase("upsert");
  const error = await saveLanguages(client, "u1", { native: "es", learning: "de", level: "B1" });

  assert.equal(error, "upsert failed");
  assert.deepEqual(calls.map((c) => c.op), ["upsert"]);
});

test("languages: a failed cleanup is reported instead of ignored", async () => {
  const { client } = fakeSupabase("delete");
  assert.equal(
    await saveLanguages(client, "u1", { native: "es", learning: "de", level: "B1" }),
    "delete failed",
  );
});

test("interests: adds the chosen ones, then removes only the others", async () => {
  const { client, calls } = fakeSupabase();
  assert.equal(await saveInterests(client, "u1", [2, 3, 4]), null);

  assert.deepEqual(calls.map((c) => c.op), ["upsert", "delete"]);
  assert.deepEqual((calls[0].detail as { options: unknown }).options, {
    onConflict: "user_id,interest_id",
    ignoreDuplicates: true,
  });
  assert.deepEqual(calls[1].detail, [["eq", "user_id", "u1"], ["not", "interest_id", "in", "(2,3,4)"]]);
});

test("interests: choosing none clears them, and a failed write deletes nothing", async () => {
  const none = fakeSupabase();
  assert.equal(await saveInterests(none.client, "u1", []), null);
  assert.deepEqual(none.calls.map((c) => c.op), ["delete"]);
  assert.deepEqual(none.calls[0].detail, [["eq", "user_id", "u1"]]);

  const failing = fakeSupabase("upsert");
  assert.equal(await saveInterests(failing.client, "u1", [1]), "upsert failed");
  assert.deepEqual(failing.calls.map((c) => c.op), ["upsert"]);
});
