# Project-Scoped Agent Guidelines (AGENTS.md)

## Loop & Polling Prevention Protocol

When running the interactive agent pipeline or executing shell tasks:

1. **Do NOT Poll Task Status**: 
   Never call `manage_task` with action `status` in a loop, and never run shell loops to wait for a command to finish.
   
2. **Utilize Reactive Wakeups**:
   - When launching a background command (e.g., `om_interactive_agent.py --mode 2`), set `WaitMsBeforeAsync` to a small value (like `5000` or `10000`).
   - If the task does not finish synchronously, schedule a one-shot wake-up timer using the `schedule` tool (e.g., `DurationSeconds="30"`) and immediately stop calling tools.
   - Wait for the system's reactive message when the task finishes or the timer fires.

3. **HITL Gate Decisions**:
   - At Gate 2 (Publish Schedule), do not guess or try to automate approval choices on your own. 
   - Always present the generated draft and slug details directly to the user using the `ask_question` tool.
   - Wait for the user's explicit choice, write that choice to `bridge_input.txt`, and rerun the pipeline.
