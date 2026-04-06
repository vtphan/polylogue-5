#!/usr/bin/env python3
"""Append a telemetry entry to a scenario's pipeline log.

Each pipeline command calls this helper at meaningful stage boundaries
(agent invocation, reviewer verdict, retry, halt, save). The log is a
YAML stream — one document per entry, separated by `---` — at:

    artifacts/<scenario_id>/pipeline_log.yaml

Append-only by design: each invocation opens the log in append mode and
writes a single document. There is no read-modify-write step, so an
interrupted run can lose at most the in-flight event, never prior history.
Read the log with `yaml.safe_load_all(open(path))`.

Entries record stage, agent, attempt number, verdict, retries remaining,
timestamp, and an optional free-form note. No artifact content is logged —
just the trace — so the log is safe to commit and grep.

# Stage vocabulary (canonical — keep this in sync with the command files)
#
# Producer stages:    planning, dialog_writer, transcript_id, evaluator,
#                     scaffolding_id, scoring_rubric
# Reviewer stages:    validation, transcript_review, analysis_review,
#                     scaffolding_review, structural_review
# Validation stages:  schema_validation
# Lifecycle stages:   start, save, halt, rename_pending,
#                     toggle_override, instruction_override
#
# Verdict vocabulary: ACCEPT | REVISE | REGENERATE | REJECT |
#                     PASS | FAIL | SAVE | HALT | START | draft_returned

Usage:
    python3 framework/pipeline/scripts/log_pipeline_event.py \\
        --scenario <scenario_id> \\
        --command <command_name> \\
        --stage <stage_label> \\
        [--agent <agent_name>] \\
        [--attempt <int>] \\
        [--verdict <verdict_label>] \\
        [--retries-remaining <int>] \\
        [--notes "<free text>"] \\
        [--artifacts <root>]   # default: artifacts

For /create_scenario, the scenario_id is not known until after the planning
agent runs. Log the early events under a per-run timestamped pending id
(e.g. `_pending_20260406T173000Z`) so concurrent or sequential aborted
runs do not stomp on each other. Once the real scenario_id is assigned,
merge the pending log into the real directory:

    python3 framework/pipeline/scripts/log_pipeline_event.py \\
        --rename-pending <pending_id> <real_scenario_id> \\
        [--artifacts <root>]

The merge moves (or concatenates) the pending log into the real scenario
directory, removes the empty pending directory, and records the merge as
a `rename_pending` event in the destination log.
"""

import argparse
import datetime as dt
import os
import sys

import yaml


def append_entry(log_path, entry):
    """Append one YAML document to the log file.

    Append-only: opens with mode 'a' and writes a single `---` document.
    No prior content is read or rewritten.
    """
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "a") as f:
        f.write("---\n")
        yaml.safe_dump(entry, f, sort_keys=False, default_flow_style=False)


def rename_pending(artifacts_root, pending_id, real_id):
    """Merge artifacts/<pending_id>/pipeline_log.yaml into the real dir.

    If the destination has no log yet, the file is moved (rename).
    If the destination already has a log, the pending events are
    prepended (they are chronologically earlier). The empty pending
    directory is then removed. Finally, a `rename_pending` event is
    appended to the destination log.
    """
    src = os.path.join(artifacts_root, pending_id, "pipeline_log.yaml")
    dst_dir = os.path.join(artifacts_root, real_id)
    dst = os.path.join(dst_dir, "pipeline_log.yaml")

    if not os.path.exists(src):
        # Nothing to merge. Not an error: the operator may not have
        # logged any pending events before /create_scenario named the
        # scenario.
        return 0

    os.makedirs(dst_dir, exist_ok=True)

    if os.path.exists(dst):
        with open(src) as f:
            pending_bytes = f.read()
        with open(dst) as f:
            existing_bytes = f.read()
        with open(dst, "w") as f:
            f.write(pending_bytes)
            f.write(existing_bytes)
        os.remove(src)
    else:
        os.rename(src, dst)

    pending_dir = os.path.join(artifacts_root, pending_id)
    try:
        if os.path.isdir(pending_dir) and not os.listdir(pending_dir):
            os.rmdir(pending_dir)
    except OSError:
        pass

    append_entry(dst, {
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "command": "log_pipeline_event",
        "stage": "rename_pending",
        "notes": f"merged events from {pending_id}",
    })
    return 0


def main():
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument("--scenario")
    ap.add_argument("--command")
    ap.add_argument("--stage")
    ap.add_argument("--agent", default=None)
    ap.add_argument("--attempt", type=int, default=None)
    ap.add_argument("--verdict", default=None)
    ap.add_argument("--retries-remaining", type=int, default=None,
                    dest="retries_remaining")
    ap.add_argument("--notes", default=None)
    ap.add_argument("--artifacts", default="artifacts")
    ap.add_argument(
        "--rename-pending", nargs=2, metavar=("PENDING", "REAL"),
        default=None,
        help="Merge artifacts/<PENDING>/pipeline_log.yaml into "
             "artifacts/<REAL>/pipeline_log.yaml and clean up the "
             "empty pending directory.",
    )
    args = ap.parse_args()

    if args.rename_pending:
        return rename_pending(args.artifacts, *args.rename_pending)

    if not (args.scenario and args.command and args.stage):
        ap.error("--scenario, --command, and --stage are required "
                 "unless using --rename-pending")

    log_path = os.path.join(args.artifacts, args.scenario, "pipeline_log.yaml")

    entry = {
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "command": args.command,
        "stage": args.stage,
    }
    if args.agent:
        entry["agent"] = args.agent
    if args.attempt is not None:
        entry["attempt"] = args.attempt
    if args.verdict:
        entry["verdict"] = args.verdict
    if args.retries_remaining is not None:
        entry["retries_remaining"] = args.retries_remaining
    if args.notes:
        entry["notes"] = args.notes

    append_entry(log_path, entry)
    return 0


if __name__ == "__main__":
    sys.exit(main())
