'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LanMessagePacket, ChatMessage, FloatingEmoji } from '../types/game';

interface UseLanMultiplayerOptions {
  onPacketReceived?: (packet: LanMessagePacket) => void;
  guestDefaultName?: string;
}

export function useLanMultiplayer({ onPacketReceived, guestDefaultName = 'Khách (O)' }: UseLanMultiplayerOptions = {}) {
  const [lanRole, setLanRole] = useState<'HOST' | 'GUEST'>('HOST');
  const [lanRoomCode, setLanRoomCode] = useState<string>('');
  const [lanStatus, setLanStatus] = useState<'DISCONNECTED' | 'WAITING' | 'CONNECTED'>('DISCONNECTED');
  const [lanTransport, setLanTransport] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'SYSTEM', text: 'Chào mừng đến với đấu trường CyberCaro 3D 30x30!', time: 'Now' }
  ]);
  const [floatingEmoji, setFloatingEmoji] = useState<FloatingEmoji | null>(null);

  const peerInstanceRef = useRef<any>(null);
  const peerConnRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const onPacketReceivedRef = useRef(onPacketReceived);

  useEffect(() => {
    onPacketReceivedRef.current = onPacketReceived;
  }, [onPacketReceived]);

  const sendLanPacket = useCallback((packet: LanMessagePacket) => {
    if (peerConnRef.current && peerConnRef.current.open) {
      try {
        peerConnRef.current.send(packet);
      } catch (e) {}
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(packet);
      } catch (e) {}
    }
  }, []);

  const handleIncomingPacket = useCallback((packet: LanMessagePacket) => {
    if (!packet || !packet.type) return;

    if (packet.type === 'GUEST_JOINED') {
      setLanStatus('CONNECTED');
      setLanTransport(packet.transport || 'LAN Wi-Fi');
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'LAN',
          text: `Người chơi ${packet.guestName || 'Khách (O)'} đã kết nối vào phòng!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else if (packet.type === 'CHAT' && packet.text) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: packet.sender || 'Đối thủ',
          text: packet.text!,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else if (packet.type === 'EMOJI' && packet.emoji) {
      setFloatingEmoji({
        id: Date.now(),
        emoji: packet.emoji,
        sender: packet.sender || 'Đối thủ',
      });
    }

    onPacketReceivedRef.current?.(packet);
  }, []);

  const setupBroadcastChannel = useCallback((code: string) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close();
    }
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`cybercaro_lan_${code}`);
      bc.onmessage = (ev) => handleIncomingPacket(ev.data);
      broadcastChannelRef.current = bc;
    }
  }, [handleIncomingPacket]);

  const initPeerJS = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    if ((window as any).Peer) return (window as any).Peer;
    try {
      const { default: Peer } = await import('peerjs');
      return Peer;
    } catch {
      return (window as any).Peer || null;
    }
  }, []);

  const createLanRoom = useCallback(async () => {
    const code =
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      '-' +
      Math.floor(10 + Math.random() * 89);

    setLanRoomCode(code);
    setLanRole('HOST');
    setLanStatus('WAITING');

    setupBroadcastChannel(code);

    try {
      const Peer = await initPeerJS();
      if (Peer) {
        if (peerInstanceRef.current) peerInstanceRef.current.destroy();
        const peerId = `cybercaro-3d-${code.toLowerCase()}`;
        const peer = new Peer(peerId);
        peerInstanceRef.current = peer;

        peer.on('connection', (conn: any) => {
          peerConnRef.current = conn;
          conn.on('open', () => {
            setLanStatus('CONNECTED');
            setLanTransport('WebRTC P2P Wi-Fi');
          });
          conn.on('data', (data: any) => handleIncomingPacket(data));
        });
      }
    } catch (e) {
      console.warn('PeerJS fallback to BroadcastChannel:', e);
    }
  }, [setupBroadcastChannel, initPeerJS, handleIncomingPacket]);

  const joinLanRoom = useCallback(async (rawCode: string) => {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) return;

    setLanRoomCode(cleanCode);
    setLanRole('GUEST');
    setLanStatus('WAITING');

    setupBroadcastChannel(cleanCode);

    setTimeout(() => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'GUEST_JOINED',
          guestName: guestDefaultName,
          transport: 'Local LAN Sync',
        });
      }
    }, 150);

    try {
      const Peer = await initPeerJS();
      if (Peer) {
        if (peerInstanceRef.current) peerInstanceRef.current.destroy();
        const peer = new Peer();
        peerInstanceRef.current = peer;

        peer.on('open', () => {
          const hostPeerId = `cybercaro-3d-${cleanCode.toLowerCase()}`;
          const conn = peer.connect(hostPeerId, { reliable: true });
          peerConnRef.current = conn;

          conn.on('open', () => {
            setLanStatus('CONNECTED');
            setLanTransport('WebRTC P2P Wi-Fi');
            conn.send({
              type: 'GUEST_JOINED',
              guestName: guestDefaultName,
              transport: 'WebRTC P2P Wi-Fi',
            });
          });

          conn.on('data', (data: any) => handleIncomingPacket(data));
        });
      }
    } catch (e) {
      console.warn('PeerJS connection failed:', e);
    }

    setTimeout(() => {
      setLanStatus('CONNECTED');
      setLanTransport((prev) => prev || 'LAN Channel');
    }, 500);
  }, [setupBroadcastChannel, initPeerJS, guestDefaultName, handleIncomingPacket]);

  const sendChat = useCallback((text: string, sender: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: Date.now(),
      sender,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, msg]);
    sendLanPacket({ type: 'CHAT', sender, text: text.trim() });
  }, [sendLanPacket]);

  const sendEmoji = useCallback((emoji: string, sender: string) => {
    setFloatingEmoji({ id: Date.now(), emoji, sender });
    sendLanPacket({ type: 'EMOJI', emoji, sender });
  }, [sendLanPacket]);

  return {
    lanRole,
    lanRoomCode,
    lanStatus,
    lanTransport,
    chatMessages,
    floatingEmoji,
    createLanRoom,
    joinLanRoom,
    sendLanPacket,
    sendChat,
    sendEmoji,
    setFloatingEmoji,
  };
}
