// Shared across every preset (./node, and therefore ./react-native which composes on it, and
// ./expo which doesn't compose but still needs the identical contract) so the fleet-wide 70%
// target and the fact that it's actually enforced live in exactly one place, not independently
// copy-pasted per preset where one copy could drift from the other. collectCoverage: true is
// what makes coverageThreshold real: it only does anything when coverage is actually being
// collected, and no consumer's own test/verify script (or the shared CI workflow) ever passed
// --coverage — this was pure documentation, checked by nothing, until this was added.
const coverageDefaults = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}

module.exports = { coverageDefaults }
