"use client";

import { GlobalHeader } from "./GlobalHeader";

/**
 * MemberHeader wraps the unified Urspace GlobalHeader component
 * to guarantee 100% consistency across all member & public pages.
 */
export function MemberHeader() {
  return <GlobalHeader />;
}

export default MemberHeader;