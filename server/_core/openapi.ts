import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from '../routers';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'AYMENOS API',
  version: '1.0.0',
  baseUrl: '/api',
  description: `
# AYMENOS - The Universal Augmentor API

A revolutionary token-free AI platform where specialized agents collaborate with humans to create an augmented simulated universe.

## Features

- **Agent Management**: Create and manage specialized AI agents
- **Swarm Intelligence**: Coordinate multiple agents for complex tasks
- **Kids Mode**: Safe, educational environment for children (age 12+)
- **Multiplayer Challenges**: Real-time collaborative problem-solving
- **Marketing Automation**: AI-powered marketing campaigns
- **Build Pass System**: Blockchain-based governance and rewards
- **Task Engine**: Distributed task processing and execution

## Authentication

Most endpoints require authentication via session cookies. Use the \`/api/oauth/callback\` endpoint to authenticate.

## Real-time Features

For real-time collaboration features (multiplayer challenges, chat), connect to the WebSocket server at \`/api/collaboration\`.
  `,
  tags: [
    'Authentication',
    'Agents',
    'Agent Types',
    'Swarm Intelligence',
    'Kids Mode',
    'Multiplayer Challenges',
    'Marketing',
    'Build Pass',
    'Task Engine',
    'System'
  ],
});
