"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Field";
import { GameFooter, Instructions, Prompt } from "./shared";
import type {
  AskYourPartnerPayload,
  ConversationMissionPayload,
  CorrectionChallengePayload,
  TemplateProps,
  VoiceChallengePayload,
} from "@/features/games/engine/types";

type Props = TemplateProps & { onDone: () => void };

/**
 * The four free-text mechanics.
 *
 * None of them can be machine-graded without an AI service, so none of them
 * pretend to be: the user writes or speaks, then confirms they did it. Small,
 * honest XP beats a fake score.
 */

export function AskYourPartner({ session, onSubmit, result, submitting, onDone }: Props) {
  const payload = session.content?.payload as unknown as AskYourPartnerPayload;
  const [answer, setAnswer] = useState("");

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      <Instructions>
        Answer it yourself, then send it to a partner in chat.
      </Instructions>
      <Prompt>{payload?.prompt}</Prompt>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value.slice(0, 2000))}
        rows={5}
        placeholder="Write your answer in the language you are learning…"
        disabled={result !== null}
      />

      <GameFooter
        result={result}
        submitting={submitting}
        canSubmit={answer.trim().length > 0}
        submitLabel="I answered it"
        onSubmit={() => onSubmit({ answer: answer.trim() })}
        onDone={onDone}
      />
    </div>
  );
}

export function ConversationMission({
  session,
  onSubmit,
  result,
  submitting,
  onDone,
}: Props) {
  const payload = session.content
    ?.payload as unknown as ConversationMissionPayload;

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      <Prompt>{payload?.instructions}</Prompt>

      {payload?.suggested_questions?.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            Try asking
          </p>
          {payload.suggested_questions.map((question) => (
            <div
              key={question}
              className="rounded-2xl border border-line bg-raised px-4 py-3 text-sm text-ink [overflow-wrap:anywhere]"
            >
              {question}
            </div>
          ))}
        </div>
      )}

      <GameFooter
        result={result}
        submitting={submitting}
        canSubmit
        submitLabel="We did it"
        onSubmit={() => onSubmit({})}
        onDone={onDone}
      />
    </div>
  );
}

export function VoiceChallenge({ session, onSubmit, result, submitting, onDone }: Props) {
  const payload = session.content?.payload as unknown as VoiceChallengePayload;

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-accent-soft text-3xl short:size-16">
        🎙️
      </div>
      <Prompt>{payload?.instructions}</Prompt>
      <Instructions>
        Use your phone&apos;s own voice recorder and send the file in the chat.
        Nothing is scored — saying it out loud is the whole exercise.
      </Instructions>

      <GameFooter
        result={result}
        submitting={submitting}
        canSubmit
        submitLabel="I recorded it"
        onSubmit={() => onSubmit({})}
        onDone={onDone}
      />
    </div>
  );
}

export function CorrectionChallenge({
  session,
  onSubmit,
  result,
  submitting,
  onDone,
}: Props) {
  const payload = session.content
    ?.payload as unknown as CorrectionChallengePayload;
  const [sentence, setSentence] = useState("");

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      <Instructions>
        Write a sentence in the language you are learning, then send it in chat.
        Your partner taps it to suggest a correction — you both earn XP.
      </Instructions>

      {payload?.seed_sentence && (
        <div className="rounded-2xl bg-sunken p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            Or fix this one
          </p>
          <p className="mt-1.5 text-base text-ink [overflow-wrap:anywhere]">
            {payload.seed_sentence}
          </p>
          {payload.hint && (
            <p className="mt-1.5 text-xs italic text-muted">{payload.hint}</p>
          )}
        </div>
      )}

      <Textarea
        value={sentence}
        onChange={(e) => setSentence(e.target.value.slice(0, 2000))}
        rows={4}
        placeholder="Write your sentence…"
        disabled={result !== null}
      />

      <GameFooter
        result={result}
        submitting={submitting}
        canSubmit={sentence.trim().length > 0}
        submitLabel="Done"
        onSubmit={() => onSubmit({ answer: sentence.trim() })}
        onDone={onDone}
      />
    </div>
  );
}
