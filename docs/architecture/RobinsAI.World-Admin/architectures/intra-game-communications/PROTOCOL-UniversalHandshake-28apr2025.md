# Universal Handshake Protocol

**UUID: 7e9f2c5a-8b3d-4f1a-9c6e-d8a5e4b7c321**  
**Date: April 28, 2025**  
**Author: Robin's AI World**  
**Version: 1.0.0**

## 1. Introduction

The Universal Handshake Protocol is a critical component of our distributed multicasting architecture. It enables different applications to identify each other, negotiate capabilities, and exchange data structure definitions. This protocol ensures that all participants in a communication channel understand how to interpret the data being exchanged.

## 2. Protocol Goals

- **Platform Identification**: Allow applications to identify themselves as part of the Robin's AI World platform
- **Capability Negotiation**: Enable peers to negotiate supported features and formats
- **Schema Exchange**: Provide a mechanism for exchanging data structure definitions
- **Compatibility Verification**: Ensure that peers can communicate effectively
- **Extensibility**: Support future extensions without breaking compatibility

## 3. Handshake Message Structure

```typescript
interface HandshakeMessage {
  // Protocol identification
  protocol: {
    name: string;           // "RobinsAI.World-Multicast"
    version: string;        // Semantic versioning (e.g., "1.0.0")
    uuid: string;           // Protocol UUID for tracking
  };
  
  // Application identification
  application: {
    id: string;             // Application identifier (e.g., "ChineseChess")
    version: string;        // Application version
    type: string;           // Application type (e.g., "game", "chat")
  };
  
  // Session information
  session: {
    id: string;             // Unique session identifier
    mode: string;           // Session mode (e.g., "game", "chat")
    created: number;        // Timestamp of creation
    creator: string;        // Creator identifier
  };
  
  // Capabilities and requirements
  capabilities: {
    features: string[];     // Supported features
    dataFormats: string[];  // Supported data formats
    compression: string[];  // Supported compression methods
    encryption: string[];   // Supported encryption methods
  };
  
  // Data structure definitions
  dataStructures: {
    schemas: {              // JSON Schema definitions for data structures
      [key: string]: any;   // Key is the structure name, value is the schema
    };
    examples: {             // Example instances of data structures
      [key: string]: any;   // Key is the structure name, value is an example
    };
  };
}
```

## 4. Handshake Process

The handshake process follows these steps:

1. **Initiation**: When a client connects to a session, it immediately sends a handshake message.

2. **Capability Negotiation**: The receiving peer responds with its own handshake message, including its capabilities.

3. **Compatibility Check**: Both peers verify compatibility based on:
   - Protocol version compatibility
   - Required features support
   - Data format compatibility

4. **Feature Negotiation**: Peers determine the set of features and formats to use based on mutual capabilities.

5. **Schema Exchange**: Data structure schemas are exchanged and validated.

6. **Connection Establishment**: If all checks pass, the connection is established and normal communication begins.

7. **Fallback Mechanisms**: If incompatibilities are found, peers may negotiate fallback options or reject the connection.

## 5. Example Handshake (Chinese Chess)

```json
{
  "protocol": {
    "name": "RobinsAI.World-Multicast",
    "version": "1.0.0",
    "uuid": "7e9f2c5a-8b3d-4f1a-9c6e-d8a5e4b7c321"
  },
  "application": {
    "id": "GeneralXiangChineseChess",
    "version": "1.2.0",
    "type": "game"
  },
  "session": {
    "id": "game-28f9a1c5-6e7d-4b3a-9f8e-2d1c5b3a4f7d",
    "mode": "game",
    "created": 1714348800000,
    "creator": "player-1234"
  },
  "capabilities": {
    "features": ["state-sync", "chat", "presence", "moves", "history"],
    "dataFormats": ["json"],
    "compression": ["none", "gzip"],
    "encryption": ["aes-256-gcm"]
  },
  "dataStructures": {
    "schemas": {
      "GameState": {
        "type": "object",
        "properties": {
          "board": {
            "type": "array",
            "items": {
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "currentTurn": {
            "type": "string",
            "enum": ["red", "black"]
          },
          "moveHistory": {
            "type": "array",
            "items": { "$ref": "#/schemas/Move" }
          },
          "stateVersion": { "type": "integer" },
          "lastMoveTimestamp": { "type": "integer" },
          "gameStatus": {
            "type": "string",
            "enum": ["waiting", "playing", "finished"]
          },
          "players": {
            "type": "object",
            "properties": {
              "red": { "type": "string" },
              "black": { "type": "string" }
            }
          }
        }
      },
      "Move": {
        "type": "object",
        "properties": {
          "from": { "type": "string" },
          "to": { "type": "string" },
          "piece": { "type": "string" },
          "captured": { "type": "string" }
        },
        "required": ["from", "to", "piece"]
      }
    },
    "examples": {
      "GameState": {
        "board": [
          ["R", "H", "E", "A", "G", "A", "E", "H", "R"],
          ["", "", "", "", "", "", "", "", ""],
          ["", "C", "", "", "", "", "", "C", ""],
          ["S", "", "S", "", "S", "", "S", "", "S"],
          ["", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", ""],
          ["s", "", "s", "", "s", "", "s", "", "s"],
          ["", "c", "", "", "", "", "", "c", ""],
          ["", "", "", "", "", "", "", "", ""],
          ["r", "h", "e", "a", "g", "a", "e", "h", "r"]
        ],
        "currentTurn": "red",
        "moveHistory": [],
        "stateVersion": 0,
        "lastMoveTimestamp": 1714348800000,
        "gameStatus": "waiting",
        "players": {
          "red": "Player 1",
          "black": null
        }
      },
      "Move": {
        "from": "a3",
        "to": "a4",
        "piece": "s"
      }
    }
  }
}
```

## 6. Implementation Guidelines

When implementing the Universal Handshake Protocol:

1. **Versioning**: Always include protocol version information to support future changes.

2. **Schema Validation**: Validate received schemas against expected formats.

3. **Graceful Degradation**: If a peer doesn't support all features, try to operate with a reduced feature set.

4. **Security**: Consider adding authentication and encryption to the handshake process.

5. **Extensibility**: Design message formats to allow for future extensions.

6. **Error Handling**: Provide clear error messages when handshake fails.

7. **Timeout Handling**: Implement timeouts for handshake responses.

## 7. Future Extensions

Potential future extensions to the protocol include:

- **Authentication**: Adding secure authentication mechanisms
- **Versioned Schemas**: Supporting schema versioning and migration
- **Protocol Negotiation**: Allowing negotiation of the protocol itself
- **Compression Negotiation**: Dynamically selecting compression based on network conditions
- **Feature Discovery**: Runtime discovery of available features

## 8. Conclusion

The Universal Handshake Protocol provides a robust foundation for communication between different applications in our platform. By exchanging capabilities and data structure definitions upfront, we ensure that all participants can effectively communicate regardless of their specific implementation details.
