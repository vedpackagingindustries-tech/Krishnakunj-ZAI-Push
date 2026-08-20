---
Task ID: 1
Agent: Main Agent
Task: Replace synthetic temple bell with uploaded MP3 file, set to loop continuously on homepage

Work Log:
- Copied uploaded `/upload/temple-bell-543.mp3` to `/public/audio/temple-bell.mp3`
- Replaced entire `playTempleBell()` Web Audio API synthetic bell (oscillators + harmonics) with `startTempleBell()` using HTMLAudioElement
- New implementation: loads `/audio/temple-bell.mp3`, sets `loop = true`, smooth volume fade-in from 0 to 0.6 over ~2 seconds
- Added autoplay-block fallback: if browser blocks play(), listens for first `click`/`touchstart` to resume with fade-in
- Updated ref callback from `playTempleBell()` to `startTempleBell()`
- Verified build compiles successfully with zero errors

Stage Summary:
- Temple bell now uses user's uploaded MP3 file in infinite loop
- Smooth fade-in prevents jarring audio start
- Browser autoplay restrictions handled with user-interaction fallback
- File: `/home/z/my-project/src/app/page.tsx` (lines 168-212)
- Audio: `/home/z/my-project/public/audio/temple-bell.mp3`
