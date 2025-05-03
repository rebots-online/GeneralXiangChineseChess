# MCP Server Configuration for Windows Environment

## Current Status

The hybrid Knowledge Graph (hKG) requires connectivity through MCP servers that are not currently set up in the Windows environment. The MCP configuration file is available from the Ubuntu environment but needs to be adapted for Windows.

## Required Components

1. **Neo4j** - For logical structures and relationships
2. **Qdrant** - For embedding context and semantic search
3. **PostgreSQL** - For raw audit logs of operations

## Configuration Issues

### Ubuntu to Windows Migration

The MCP JSON configuration file from Ubuntu needs to be modified to work in the Windows environment. Key differences include:

1. Path separators (forward slash vs. backslash)
2. Service startup commands
3. Port configurations
4. File permissions and access control

### Integration with General Xiang

The application currently attempts to connect to MCP services that are not available, which may cause errors or degraded functionality in:

1. Game state persistence
2. User profile management
3. Tutorial progress tracking
4. Multiplayer session management

## Next Steps

1. **Locate Ubuntu MCP Configuration**
   - Find the MCP JSON configuration file from the Ubuntu environment

2. **Adapt for Windows**
   - Modify paths to use Windows conventions
   - Update service startup commands for Windows
   - Adjust port configurations if needed
   - Set appropriate file permissions

3. **Test MCP Services**
   - Start Neo4j, Qdrant, and PostgreSQL services
   - Verify connectivity from the application
   - Test basic CRUD operations

4. **Update Application Configuration**
   - Ensure the application is configured to connect to the correct services
   - Implement proper error handling for service unavailability
   - Add fallback mechanisms for offline operation

## Related Issues

- Jami integration for online multiplayer is not functioning correctly
- Sidepanel load/save game functionality is not working
- Error handling for network operations needs improvement

## Resources

- [Neo4j Windows Installation Guide](https://neo4j.com/docs/operations-manual/current/installation/windows/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [PostgreSQL Windows Installation](https://www.postgresql.org/download/windows/)
