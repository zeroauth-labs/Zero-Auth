---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Setup WebView Infrastructure

## Objective
Establish a reliable, persistent communication bridge between React Native and a hidden WebView to host ZK logic.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- zero-auth-wallet/package.json

## Tasks

<task type="auto">
  <name>Install WebView & Setup Component</name>
  <files>
    - zero-auth-wallet/package.json
    - zero-auth-wallet/components/ZKEngine.tsx
  </files>
  <action>
    - Install `react-native-webview`.
    - Create `components/ZKEngine.tsx` with a hidden WebView (width/height 0).
    - Implement a `useZKEngine` hook to handle the singleton instance and message queue.
  </action>
  <verify>npm install && build check</verify>
  <done>Component exists and renders without crashing.</done>
</task>

<task type="auto">
  <name>Implement Bridge Protocol</name>
  <files>
    - zero-auth-wallet/components/ZKEngine.tsx
    - zero-auth-wallet/app/_layout.tsx
  </files>
  <action>
    - Create a structured `postMessage` handler (e.g., `{ type: 'REQUEST', payload: {...} }`).
    - Mount `ZKEngine` in the root `_layout.tsx` to ensure persistence.
    - Implement a "Ping" test between RN and WebView.
  </action>
  <verify>Logs show 'Bridge Connected' from WebView</verify>
  <done>RN receives a reply from the WebView within < 100ms.</done>
</task>

## Success Criteria
- [ ] `react-native-webview` is installed and functional.
- [ ] Bridge communication is established (Round-trip ping test passing).
