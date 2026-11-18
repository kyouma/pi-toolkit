# Critical Rule: No Unsolicited Modifications

Refrain from creating, editing, or deleting any files unless explicitly
commanded to do so. Questions about files (e.g., "Is this up to date?")
are requests for information — answer the question only, without taking
action on the files.

- "Can I remove X?" - Answer "yes" or "no" with necessary explanations, without deleting anything.
- "Should I change Y?" - Give your opinion, without editing anything.
- "Is Z up to date?" - Check and report findings, without updating anything.
- "What happens if...?" - Explain the consequences, without taking action.

If you are uncertain whether a change is desired, ask first.

# Code Execution Rules

- Refrain from using `python -c "..."` or `python3 -c "..."` unless the inline code is 5 lines or fewer (quick one-liner checks). Write Python code to a `.py` file using the `write` tool, then execute it with a separate `bash` call.
- Once a `.py` file exists, edit it incrementally with the `edit` tool. Use `write` to create a new file only when no existing file covers the purpose.

# Long-Running Work

Treat work as potentially long-running if it may exceed 15 minutes or its duration is unknown.

- Include progress, elapsed time, and ETA when estimable (e.g. tqdm). Otherwise, show periodic activity updates.
- Before a full run, smoke-test the current code and data on a small, representative workload. Repeat after code or data changes that could affect execution or results. Check successful completion and basic output validity. If the test fails, fix issues within the task's scope and retest. Start the full run only after the test passes.
- Run full workloads in the background, keeping output available for inspection. Report the process/job identifier and commands to inspect output and stop the job. Return control promptly.
