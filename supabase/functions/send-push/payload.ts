export type Target = {
  user_id: string;
  kind: "message" | "match";
  match_id: string;
  sender_first_name: string | null;
  tokens: string[];
};

export type PushData = { title: string; body: string; url: string; tag: string };

/**
 * What the device is shown. Deliberately generic: the person's first name and a
 * fixed sentence, never message text (it passes through Google's servers and
 * shows on lock screens). The Edge Function never even receives message text.
 */
export function buildPushData(target: Pick<Target, "kind" | "match_id" | "sender_first_name">): PushData {
  const url = `/messages/${target.match_id}`;
  if (target.kind === "match") {
    return { title: "Lingua Match", body: "You have a new language partner", url, tag: `match-${target.match_id}` };
  }
  const name = target.sender_first_name?.trim();
  return {
    title: name ? name.slice(0, 40) : "Lingua Match",
    body: "Sent you a message",
    url,
    tag: `chat-${target.match_id}`,
  };
}
