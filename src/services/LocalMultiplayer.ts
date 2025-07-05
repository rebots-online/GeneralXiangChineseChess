export type LocalGameMessage =
  | { type: 'join-request' }
  | { type: 'join-accepted' }
  | { type: 'custom'; payload: any };

class LocalMultiplayer {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(msg: LocalGameMessage) => void>();

  hostGame(code: string) {
    this.close();
    this.channel = new BroadcastChannel(`xiangqi-${code}`);
    this.channel.onmessage = (e) => {
      const msg = e.data as LocalGameMessage;
      if (msg.type === 'join-request') {
        this.channel?.postMessage({ type: 'join-accepted' });
      }
      this.listeners.forEach((fn) => fn(msg));
    };
  }

  joinGame(code: string) {
    this.close();
    this.channel = new BroadcastChannel(`xiangqi-${code}`);
    this.channel.onmessage = (e) => {
      const msg = e.data as LocalGameMessage;
      this.listeners.forEach((fn) => fn(msg));
    };
    this.channel.postMessage({ type: 'join-request' });
  }

  send(msg: LocalGameMessage) {
    this.channel?.postMessage(msg);
  }

  on(fn: (msg: LocalGameMessage) => void) {
    this.listeners.add(fn);
  }

  off(fn: (msg: LocalGameMessage) => void) {
    this.listeners.delete(fn);
  }

  close() {
    this.channel?.close();
    this.channel = null;
  }
}

export default new LocalMultiplayer();
