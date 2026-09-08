// Shared across every preset (./node, and therefore ./react-native which composes on it, and
// ./expo which doesn't compose but still needs the identical contract — same reasoning as
// coverageDefaults.cjs living here rather than being copy-pasted into both). Unlike coverage,
// there's no apps-vs-libraries split to account for: an oversubscribed machine punishes a heavy
// integration-style app test exactly the same way it punishes a heavy library test, so this one
// applies identically everywhere, no per-preset exception.
//
// Jest's own default (`numCpus - 1` heavy worker processes) assumes every logical core is an
// equally fast, otherwise-idle lane. Neither holds on a real fleet dev machine: Apple Silicon's
// efficiency cores run sustained JS work at a fraction of a performance core's speed (confirmed
// via `sysctl hw.perflevel0.physicalcpu hw.perflevel1.physicalcpu` on a real dev machine: an M1
// Pro reports 8 logical CPUs as 6 performance + 2 efficiency, not 8 equal ones), and a real dev
// machine is never idle outside of Jest — an IDE, other Claude Code sessions, and often a native
// build are all real, simultaneous, CPU-hungry neighbors, not edge cases.
//
// This matters more than "tests run a bit slower" because oversubscription doesn't just add a
// proportional tax — a worker that isn't rescheduled promptly still has to finish its real
// (non-fake) timers and effects inside Jest's fixed per-test timeout, so too many workers produces
// outright timeout failures, not just a slower pass. Verified directly against a real consuming
// app (Hangman, 30 suites / 391 tests, ./expo preset) rather than a scratch fixture: at Jest's
// default of 7 workers on that 6-performance-core M1 Pro, 6-14 of the heaviest suites (the ones
// rendering the largest component trees) flaked with bare "Exceeded timeout of 5000ms" failures —
// no assertion detail, meaning the code was never wrong, it just didn't get scheduled in time. Two
// structurally-identical real-timer hook tests (usePopSound.test.ts, useClickSound.test.ts — same
// mock setup, same fixed 10ms/0ms real setTimeout waits), run in the very same invocation, took
// 22s and 744s respectively: same code, same waits, purely different scheduling luck. Capping
// maxWorkers at 4 (50% of 8) made that exact same suite pass 391/391 — and finish in 21s, actually
// *faster* than the uncapped default's 62s on an otherwise-idle machine, because nothing was left
// idle mid-test waiting to be rescheduled.
//
// A percentage, not a fixed number: this package runs across whatever machine each fleet developer
// actually has, and the underlying problem (a real dev machine always has other CPU-hungry
// neighbors) applies regardless of core count, so the default should scale with the machine
// instead of baking in one Mac's number. Still fully overridable via `overrides.maxWorkers` (e.g.
// CI, where the runner's own resource limits and lack of competing local processes may justify a
// different value).
const workerDefaults = {
  maxWorkers: '50%'
}

module.exports = { workerDefaults }
