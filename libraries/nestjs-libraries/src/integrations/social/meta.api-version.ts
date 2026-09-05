/**
 * Single source of truth for the Meta Graph API version.
 *
 * Every Facebook, Instagram and Instagram-standalone request in this codebase
 * interpolates META_GRAPH_VERSION instead of hard-coding a version, so moving
 * to a new Graph release is a one-line change here rather than ~58 scattered
 * string edits across three providers.
 *
 * Meta withdraws each version roughly two years after release, and a withdrawn
 * version stops answering: every publish and every analytics read fails at
 * once, with no gradual degradation.
 *
 * History and runway (developers.facebook.com/docs/graph-api/changelog,
 * read 2026-09-05):
 *   v20.0  withdrawn 2026-09-24   <- was hard-coded in 53 places
 *   v21.0  withdrawn 2027-01-21   <- was hard-coded in 5 places (IG insights)
 *   v25.0  available until 2028-07-29  <- pinned below
 *   v26.0  released 2026-07-29, withdrawal date not yet published
 *
 * Before changing the pin, read the changelog for the target version's breaking
 * changes, then bump both constants together so the health check keeps warning
 * at the right time.
 */
export const META_GRAPH_VERSION = 'v25.0';

/** Withdrawal date of META_GRAPH_VERSION, ISO date. Drives the health check. */
export const META_GRAPH_VERSION_SUNSET = '2028-07-29';
