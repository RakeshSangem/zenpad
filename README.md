# Zenpad

A minimal, distraction-free notepad for focused writing. Built with React and Tailwind CSS.

## Features

- **Clean Interface**: No clutter, no distractions. Just you and your words.
- **Persistent Storage**: All notes are saved to browser localStorage automatically.
- **Keyboard Shortcuts**: Power-user shortcuts for everything (see below).
- **Flat Design**: No gradients, no animations, no gimmicks. Pure functionality.

## Keyboard Shortcuts


| Shortcut       | Action                                  |
| -------------- | --------------------------------------- |
| `Cmd/Ctrl + N` | Create new note                         |
| `Cmd/Ctrl + S` | Save note manually                      |
| `Cmd/Ctrl + D` | Delete current note (with confirmation) |
| `Cmd/Ctrl + B` | Toggle sidebar visibility               |
| `Cmd/Ctrl + ↑` | Navigate to previous note               |
| `Cmd/Ctrl + ↓` | Navigate to next note                   |
| `Esc`          | Blur editor / exit focus mode           |
| `?`            | Show keyboard shortcuts help            |


## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:3000`.

## Storage

Notes are stored in your browser's localStorage under the key `zenpad-store`. They persist across browser restarts and will be available as long as you don't clear browser data.

---

Built for developers who live in their editor all day.