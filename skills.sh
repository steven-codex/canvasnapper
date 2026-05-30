#!/usr/bin/env bash
# ==============================================================================
# Canva Snapper (Pro Edition) - Agent Skills Blueprint
# ==============================================================================
# This script registers and documents key behavioral guidelines, style systems, 
# and implementation standards for AI agents working in this repository.
# ==============================================================================

echo "============================================================"
echo "⚡ Canva Snapper Agent Skills Registry Active"
echo "============================================================"

# 1. FRONTEND DESIGN & UX PRO (anthropics/skills/frontend-design)
# ------------------------------------------------------------------------------
# Guidelines:
# - Theme: Modern dark/light premium aesthetic (Figma/Linear desaturated shades).
# - Color Palette (Dark): Background #0F0F11, Surface #17171C, Accent #8B5CF6 (Violet-500)
# - Typography: Outfits/Inter styled system. Maximize readability in small layouts.
# - Density: Very compact for Chrome Extension popups (360px wide).
# - Animation: Use CSS transitions for theme toggles and hover highlights.

# 2. SHADCN/UI & COMPONENTS (shadcn/ui Pnpm Integrator equivalent)
# ------------------------------------------------------------------------------
# Guidelines:
# - Reusable component patterns in src/popup/components/
# - Toast Notifications: Toast overlay MUST be injected inside a Shadow DOM 
#   container in the Canva Editor DOM:
#   Create custom element: <canva-snapper-toast-root>
#   Attach shadow root: element.attachShadow({ mode: 'open' })
#   Inject styles separately to guarantee zero stylesheet leakage.

# 3. DOM & EXTRACTION CORE LOGIC (obra/superpowers)
# ------------------------------------------------------------------------------
# Guidelines:
# - Apply Plan-Before-Code.
# - Canvas API operations must use try-catch and release resources cleanly.
# - Detect elements dynamically at cursor using elementsFromPoint(x, y)
#   to bypass transparent Canva overlay divs.
# - CORS Bypass: Content script asks Service Worker to fetch the image bytes, 
#   returns ArrayBuffer, Content script loads it via ObjectURL to avoid 
#   SecurityError (tainted canvas) during toBlob().

# 4. HEADLESS TESTING DIRECTIVES (vercel-labs/agent-browser)
# ------------------------------------------------------------------------------
# Guidelines:
# - To test, use browser subagent or Playwright script to verify background 
#   service worker context menu creation and tab-level messages.
# - Verify that navigator.clipboard.write writes valid transparent image data.

echo "📋 Rules registered in codebase. Proceeding with development..."
