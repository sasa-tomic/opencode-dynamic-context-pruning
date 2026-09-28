import assert from "node:assert/strict"
import "./lab/persistence-env"
import test from "node:test"
import { isIgnoredUserMessage } from "../lib/messages/query"
import type { WithParts } from "../lib/state"

function buildMessage(role: "user" | "assistant", parts: WithParts["parts"]): WithParts {
    const sessionID = "ses_message_utils"

    const info =
        role === "user"
            ? {
                  id: `msg-${role}`,
                  role,
                  sessionID,
                  agent: "assistant",
                  model: {
                      providerID: "anthropic",
                      modelID: "claude-test",
                  },
                  time: { created: 1 },
              }
            : {
                  id: `msg-${role}`,
                  role,
                  sessionID,
                  agent: "assistant",
                  time: { created: 1 },
              }

    return {
        info: info as WithParts["info"],
        parts,
    }
}

test("isIgnoredUserMessage only ignores user messages", () => {
    const ignoredUserMessage = buildMessage("user", [])
    const assistantMessage = buildMessage("assistant", [])

    assert.equal(isIgnoredUserMessage(ignoredUserMessage), true)
    assert.equal(isIgnoredUserMessage(assistantMessage), false)
})

test("isIgnoredUserMessage recognizes DCP chat notifications by marker", () => {
    const markerMessage = buildMessage("user", [
        { id: "p1", sessionID: "s", messageID: "msg-user", type: "text", text: "▣ DCP\nreport" },
    ] as WithParts["parts"])
    const triggerPrompt = buildMessage("user", [
        {
            id: "p1",
            sessionID: "s",
            messageID: "msg-user",
            type: "text",
            text: "<compress triggered manually>\n\nManual mode trigger received.",
        },
    ] as WithParts["parts"])
    const realMessage = buildMessage("user", [
        { id: "p1", sessionID: "s", messageID: "msg-user", type: "text", text: "hello" },
    ] as WithParts["parts"])

    assert.equal(isIgnoredUserMessage(markerMessage), true)
    // Manual-trigger prompts must stay visible to the model.
    assert.equal(isIgnoredUserMessage(triggerPrompt), false)
    assert.equal(isIgnoredUserMessage(realMessage), false)
})
