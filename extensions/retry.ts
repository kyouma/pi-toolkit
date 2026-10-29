import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// A persisted, hidden control message, not an instruction for the model.
const RETRY_TRIGGER = "manual-retry:trigger";

export default function retryExtension(pi: ExtensionAPI) {
	// display:false only hides a message in the UI. Also remove our triggers
	// from every model request, including after reloading/resuming a session.
	pi.on("context", (event) => ({
		messages: event.messages.filter(
			(message) => message.role !== "custom" || message.customType !== RETRY_TRIGGER,
		),
	}));

	pi.registerCommand("retry", {
		description: "Retry the last failed or aborted response without a new user message",
		handler: async (args, ctx) => {
			if (args.trim()) {
				ctx.ui.notify("Usage: /retry", "warning");
				return;
			}

			// Do not enqueue a retry that could run after an already-successful turn.
			if (!ctx.isIdle() || ctx.hasPendingMessages()) {
				ctx.ui.notify("Pi is still busy. Wait for it to finish, or press Escape to stop it first.", "warning");
				return;
			}

			// Inspect the active branch, not cached event state: this also works
			// after /reload, /resume, or navigation in /tree.
			const lastMessage = ctx.sessionManager
				.getBranch()
				.slice()
				.reverse()
				.find((entry) => entry.type === "message" && entry.message.role !== "system");

			if (
				lastMessage?.type !== "message" ||
				lastMessage.message.role !== "assistant" ||
				(lastMessage.message.stopReason !== "error" && lastMessage.message.stopReason !== "aborted")
			) {
				ctx.ui.notify("There is no failed or aborted response to retry on this branch.", "info");
				return;
			}

			ctx.ui.notify("Retrying the last request…", "info");
			// Public API for starting a run without inserting a user prompt.
			// Pi's provider adapters already omit error/aborted assistant messages.
			pi.sendMessage(
				{ customType: RETRY_TRIGGER, content: [], display: false },
				{ triggerTurn: true },
			);
		},
	});
}
