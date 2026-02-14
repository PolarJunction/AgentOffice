# Agent Office

A 2D pixel art office visualization for OpenClaw AI agents. Watch your agents work, relax, and collaborate in real-time.

## Agents

| Agent | Role | Office Location |
|-------|------|----------------|
| Nova | Architect | Corner office with whiteboard |
| Zero (x3) | Builder workers | Developer pod (3 desks) |
| Delta | Code reviewer | Review station |
| Bestie | Personal assistant | Reception/lounge |
| Dexter | General agent | Flex desk |

## How It Works

- Connects to the OpenClaw gateway to monitor agent sessions
- When an agent is idle → pixel character relaxes in the kitchen/lounge
- When an agent starts working → walks to their desk and begins typing
- Zero has 3 parallel workers shown as clone characters

## Tech Stack

- **Frontend:** HTML5 Canvas with pixel art sprites
- **Backend:** Node.js server polling OpenClaw gateway
- **Deployment:** Docker container on port 3004

## Development

```bash
docker compose up --build
```
