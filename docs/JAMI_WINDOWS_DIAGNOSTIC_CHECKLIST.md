# Jami Windows Diagnostic Checklist

## Quick Diagnostic Steps for Windows Environment

This checklist is designed for quick diagnosis of Jami integration issues when working in Windows, which may not be your primary development environment.

## Initial Verification

- [ ] Confirm Jami desktop application works on Windows
  - Install the official Jami client from [jami.net](https://jami.net/download/)
  - Create a test account or sign in with existing credentials
  - Test basic functionality (messaging, calls)

- [ ] Check Windows-specific configurations
  - Verify Windows Firewall settings
  - Check if antivirus is blocking WebRTC connections
  - Confirm required ports are open (UDP 10000-20000, TCP 443)

## Application Diagnostics

- [ ] Add console logging for Jami connection attempts
  ```javascript
  console.log('Attempting Jami connection...');
  console.log('Connection parameters:', params);
  try {
    // Jami connection code
    console.log('Connection successful');
  } catch (error) {
    console.error('Connection failed:', error);
  }
  ```

- [ ] Check browser console for specific errors
  - Open browser developer tools (F12)
  - Look for WebRTC-related errors
  - Check for CORS issues
  - Note any security warnings

- [ ] Test with different browsers
  - Chrome
  - Firefox
  - Edge

## Network Testing

- [ ] Run basic WebRTC test
  - Visit [WebRTC Sample](https://webrtc.github.io/samples/src/content/peerconnection/pc1/)
  - Verify if the basic peer connection works
  - Check if camera/microphone permissions work

- [ ] Temporarily disable Windows Firewall
  - Control Panel → System and Security → Windows Defender Firewall
  - Turn off Windows Defender Firewall (temporarily for testing)
  - Test Jami integration again

- [ ] Check network configuration
  - Run `ipconfig /all` in Command Prompt
  - Note the network interfaces and their configurations
  - Check for any VPN or proxy settings that might interfere

## Code Inspection

- [ ] Review Jami initialization code
  - Check for hardcoded paths using Linux conventions
  - Look for OS-specific code that might not work on Windows
  - Verify environment variables are correctly set

- [ ] Examine error handling
  - Add more detailed error catching
  - Log full error objects, not just messages
  - Add OS detection: `const isWindows = navigator.platform.indexOf('Win') > -1;`

## Quick Fixes to Try

- [ ] Add explicit ICE servers configuration
  ```javascript
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];
  ```

- [ ] Implement a connection timeout with clear feedback
  ```javascript
  const connectionTimeout = setTimeout(() => {
    console.error('Connection timed out');
    // Show user-friendly error message
    showConnectionError('Connection timed out. Please check your network settings.');
  }, 15000); // 15 seconds timeout
  
  // Clear timeout on successful connection
  onConnectionSuccess(() => {
    clearTimeout(connectionTimeout);
  });
  ```

- [ ] Add fallback mechanism for offline play
  - Detect connection failures
  - Offer offline mode automatically
  - Store game state locally

## Documentation

- [ ] Document all findings
  - Note specific errors encountered
  - Record which tests passed/failed
  - Document any Windows-specific workarounds discovered

- [ ] Create Windows setup instructions
  - List required firewall configurations
  - Document browser settings needed
  - Include troubleshooting steps for common issues

## Follow-up Actions

- [ ] Plan for cross-platform testing
  - Set up regular testing in both Ubuntu and Windows
  - Create automated tests that can run in both environments
  - Consider using a cross-platform testing service

- [ ] Consider alternative implementations
  - Research WebSocket-based alternatives
  - Evaluate server-relay options for challenging networks
  - Look into cross-platform libraries that abstract WebRTC differences

## Resources

- [Jami Documentation](https://jami.net/documentation/)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Windows Firewall Configuration](https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-firewall/windows-firewall-with-advanced-security)
- [Browser WebRTC Support](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/adapter.js)
