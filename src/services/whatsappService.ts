import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WhatsAppMessage, WhatsAppInstance, Lead } from '../types';

export const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolution.vitrai.com.br';
export const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '3c_evolution_secret_994821';

// Pre-seeded LID -> Phone JID mappings discovered from WhatsApp groups & metadata
const INITIAL_LID_TO_PHONE: Record<string, string> = {
  "258535606747223@lid": "5511974731702@s.whatsapp.net",
  "60783065059582@lid": "5511990136293@s.whatsapp.net",
  "132341599047928@lid": "5511975582448@s.whatsapp.net",
  "39402667544693@lid": "5511961143164@s.whatsapp.net",
  "14624413991003@lid": "5511910390090@s.whatsapp.net",
  "10466986348644@lid": "558581201330@s.whatsapp.net",
  "40394268119180@lid": "558581041330@s.whatsapp.net",
  "12107613499531@lid": "5511989544036@s.whatsapp.net",
  "239560390869110@lid": "5511945495729@s.whatsapp.net",
  "3238589911125@lid": "5511945745192@s.whatsapp.net",
  "209169302954231@lid": "5511957907716@s.whatsapp.net",
  "4106559172828@lid": "5511914926110@s.whatsapp.net",
  "222281787797523@lid": "5511959604910@s.whatsapp.net",
  "275746178207778@lid": "5511945705274@s.whatsapp.net",
  "271365345161447@lid": "5511945380821@s.whatsapp.net",
  "4913576853670@lid": "5511941776744@s.whatsapp.net",
  "19010146029704@lid": "18014003974@s.whatsapp.net",
  "129510527738096@lid": "5511940172064@s.whatsapp.net",
  "174483079995641@lid": "5511989848423@s.whatsapp.net",
  "249710052950182@lid": "5511912071123@s.whatsapp.net",
  "130004482584792@lid": "5511970764544@s.whatsapp.net",
  "102925368082663@lid": "5511987608090@s.whatsapp.net",
  "60765432201441@lid": "5511916894714@s.whatsapp.net",
  "279920282439787@lid": "5511985377062@s.whatsapp.net",
  "4471178432692@lid": "5511964729348@s.whatsapp.net",
  "99497262751776@lid": "5521999112721@s.whatsapp.net",
  "254945014091901@lid": "5511934966996@s.whatsapp.net",
  "233126613799160@lid": "5511947410069@s.whatsapp.net",
  "83954480722163@lid": "557582904361@s.whatsapp.net",
  "23356132864159@lid": "5511958978930@s.whatsapp.net",
  "262435487355103@lid": "5511999960349@s.whatsapp.net",
  "74466361118782@lid": "5511999220052@s.whatsapp.net",
  "160189848236063@lid": "5511950953663@s.whatsapp.net",
  "273314773737603@lid": "5511964413204@s.whatsapp.net",
  "257049950720143@lid": "5511976446944@s.whatsapp.net",
  "178498958286902@lid": "5511997395219@s.whatsapp.net",
  "40398999277620@lid": "5511957331806@s.whatsapp.net",
  "198926359646377@lid": "16053660506@s.whatsapp.net",
  "98359549419574@lid": "5511960113127@s.whatsapp.net",
  "125696630349904@lid": "5511968321721@s.whatsapp.net",
  "164823849517246@lid": "5511995856607@s.whatsapp.net",
  "143276418031695@lid": "5511978838749@s.whatsapp.net",
  "263969277223035@lid": "5511976379041@s.whatsapp.net",
  "122728724086812@lid": "5511968075156@s.whatsapp.net",
  "247880547844103@lid": "13855377111@s.whatsapp.net",
  "263724547985553@lid": "5511917096630@s.whatsapp.net",
  "235690759561413@lid": "5511971601257@s.whatsapp.net",
  "85861496553674@lid": "5511994096036@s.whatsapp.net",
  "184877035036739@lid": "5511959572334@s.whatsapp.net",
  "151350453248240@lid": "5511994812609@s.whatsapp.net",
  "155967509541037@lid": "5511981557612@s.whatsapp.net",
  "92294652924095@lid": "5511983693038@s.whatsapp.net",
  "152652012892398@lid": "5511945777241@s.whatsapp.net",
  "66654235033688@lid": "5511999900144@s.whatsapp.net",
  "57982175973428@lid": "5511965722207@s.whatsapp.net",
  "201988167966882@lid": "5511964643232@s.whatsapp.net",
  "45252429762745@lid": "551148636049@s.whatsapp.net",
  "166138042404870@lid": "5511978889594@s.whatsapp.net",
  "42842382680130@lid": "5511958076398@s.whatsapp.net",
  "110282546376917@lid": "5511958732709@s.whatsapp.net",
  "117338523344903@lid": "5511975679876@s.whatsapp.net",
  "42022664728721@lid": "5511986604432@s.whatsapp.net",
  "84860098101471@lid": "5511982761299@s.whatsapp.net",
  "201507098116204@lid": "556184561294@s.whatsapp.net",
  "126599026499808@lid": "5511932279712@s.whatsapp.net",
  "30936699769075@lid": "5511971401125@s.whatsapp.net",
  "125117095006247@lid": "5511963154568@s.whatsapp.net",
  "88923724374185@lid": "5511915459836@s.whatsapp.net",
  "83829255594231@lid": "5511974867584@s.whatsapp.net",
  "92019724689631@lid": "5511979504706@s.whatsapp.net",
  "232933809995839@lid": "5511943237097@s.whatsapp.net",
  "8774735679733@lid": "554488125172@s.whatsapp.net",
  "61048782602336@lid": "5511960399151@s.whatsapp.net",
  "243301374546173@lid": "5511984265621@s.whatsapp.net",
  "113524592390311@lid": "557184195165@s.whatsapp.net",
  "197547037601945@lid": "557194011168@s.whatsapp.net",
  "2993743224835@lid": "5511986076369@s.whatsapp.net"
};

const lidMemoryCache = new Map<string, string>(Object.entries(INITIAL_LID_TO_PHONE));
const nameMemoryCache = new Map<string, string>();
const picMemoryCache = new Map<string, string | null>();
const syncedGroupSessions = new Set<string>();

function isValidContactName(name?: string | null): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed === 'Você' || trimmed === '3C Vendedor' || trimmed === 'Contato WhatsApp') return false;
  // Reject strings that are purely numbers/phone formatting or raw LIDs
  if (/^\+?[\d\s().-]+$/.test(trimmed)) return false;
  return true;
}

function loadLocalCache(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCache(key: string, obj: Record<string, string>) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {
    // ignore storage quota errors
  }
}

function formatTargetNumber(phoneOrJid: string): string {
  if (phoneOrJid.includes('@lid')) {
    const mapped = lidMemoryCache.get(phoneOrJid);
    if (mapped && mapped.includes('@s.whatsapp.net')) {
      return mapped.split('@')[0].replace(/\D/g, '');
    }
    return phoneOrJid;
  }
  const cleanPhone = phoneOrJid.replace(/\D/g, '');
  if (cleanPhone.length >= 14) {
    const mapped = lidMemoryCache.get(`${cleanPhone}@lid`);
    if (mapped && mapped.includes('@s.whatsapp.net')) {
      return mapped.split('@')[0].replace(/\D/g, '');
    }
    return `${cleanPhone}@lid`;
  }
  return cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
}

export const whatsappService = {
  /**
   * Fetches the live QR code from Evolution API
   */
  async fetchLiveQrCode(sessionName: string = '3c_vendedor'): Promise<string | null> {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${sessionName}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.base64 || null;
    } catch (err) {
      console.warn('Could not fetch QR code from Evolution API:', err);
      return null;
    }
  },

  /**
   * Checks real connection state from Evolution API
   */
  async checkLiveConnectionState(sessionName: string = '3c_vendedor'): Promise<'open' | 'connecting' | 'close'> {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${sessionName}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });
      if (!res.ok) return 'close';
      const data = await res.json();
      return data?.instance?.state || 'close';
    } catch (err) {
      console.warn('Could not check connection state from Evolution API:', err);
      return 'close';
    }
  },

  /**
   * Sends a real message via Evolution API with anti-ban delay & presence
   */
  async sendEvolutionMessage(sessionName: string, phoneNumber: string, text: string): Promise<boolean> {
    try {
      const targetNumber = formatTargetNumber(phoneNumber);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${sessionName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: targetNumber,
          text: text,
          delay: 1200, // Anti-ban emulation: mimics human typing
          linkPreview: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (err) {
      console.warn('Error sending message via Evolution API:', err);
      return false;
    }
  },

  /**
   * Fetches the real connected phone number from Evolution API for the session
   */
  async getConnectedPhone(sessionName: string): Promise<string | null> {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: { apikey: EVOLUTION_API_KEY },
      });
      if (res.ok) {
        const list = await res.json();
        const target = Array.isArray(list) ? list.find((i: any) => i.name === sessionName) : list;
        if (target?.ownerJid || target?.number) {
          const raw = (target.ownerJid || target.number || '').split('@')[0].replace(/\D/g, '');
          if (raw) {
            const clean = raw.startsWith('55') ? raw.slice(2) : raw;
            const ddd = clean.slice(0, 2);
            const num = clean.slice(2);
            return num.length === 9 
              ? `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
              : `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching connected phone from Evolution API:', e);
    }
    return null;
  },

  /**
   * Automatically ensures the broker's isolated instance exists on Evolution API with anti-ban protections
   */
  async ensureInstance(sessionName: string): Promise<void> {
    try {
      const checkRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${sessionName}`, {
        headers: { apikey: EVOLUTION_API_KEY },
      });
      if (checkRes.status === 404) {
        await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName: sessionName,
            integration: 'WHATSAPP-BAILEYS',
            qrcode: true,
          }),
        });

        await fetch(`${EVOLUTION_API_URL}/settings/set/${sessionName}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectCall: false, // Calls are allowed (brokers call leads)
            msgCall: '',
            groupsIgnore: true, // Keep groups ignored
            alwaysOnline: false,
            readMessages: true,
            readStatus: false,
            syncFullHistory: false,
          }),
        });
      }
    } catch (err) {
      console.warn('Error ensuring Evolution instance:', err);
    }
  },

  /**
   * Background sync of LID -> Phone mappings from group participants
   */
  syncGroupLidMappings(sessionName: string): void {
    if (syncedGroupSessions.has(sessionName)) return;
    syncedGroupSessions.add(sessionName);

    fetch(`${EVOLUTION_API_URL}/group/fetchAllGroups/${sessionName}?getParticipants=true`, {
      method: 'GET',
      headers: { apikey: EVOLUTION_API_KEY },
    })
      .then(r => (r.ok ? r.json() : []))
      .then(groups => {
        if (!Array.isArray(groups)) return;
        const stored = loadLocalCache(`3c_lid_map_${sessionName}`);
        let updated = false;
        for (const g of groups) {
          for (const p of g.participants || []) {
            if (p.id?.includes('@lid') && p.phoneNumber?.includes('@s.whatsapp.net')) {
              lidMemoryCache.set(p.id, p.phoneNumber);
              if (stored[p.id] !== p.phoneNumber) {
                stored[p.id] = p.phoneNumber;
                updated = true;
              }
            }
          }
        }
        if (updated) {
          saveLocalCache(`3c_lid_map_${sessionName}`, stored);
        }
      })
      .catch(() => {
        // ignore background sync errors
      });
  },

  /**
   * Fetches profile picture URL for a JID or phone number and caches it
   */
  async fetchProfilePicture(sessionName: string, jid: string): Promise<string | null> {
    if (picMemoryCache.has(jid)) {
      return picMemoryCache.get(jid) || null;
    }

    const storedPics = loadLocalCache(`3c_pic_cache_${sessionName}`);
    if (storedPics[jid]) {
      if (storedPics[jid] === 'NONE') {
        picMemoryCache.set(jid, null);
        return null;
      }
      picMemoryCache.set(jid, storedPics[jid]);
      return storedPics[jid];
    }

    try {
      const res = await fetch(`${EVOLUTION_API_URL}/chat/fetchProfilePictureUrl/${sessionName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: jid }),
      });
      if (res.ok) {
        const data = await res.json();
        const url = data?.profilePictureUrl || data?.picture || null;
        picMemoryCache.set(jid, url);
        const currentStored = loadLocalCache(`3c_pic_cache_${sessionName}`);
        currentStored[jid] = url || 'NONE';
        saveLocalCache(`3c_pic_cache_${sessionName}`, currentStored);
        return url;
      }
    } catch {
      // ignore
    }
    picMemoryCache.set(jid, null);
    return null;
  },

  /**
   * Batch fetches missing profile pictures for a list of JIDs
   */
  async fetchProfilePicturesBatch(sessionName: string, jids: string[]): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    const toFetch = jids.filter(jid => !picMemoryCache.has(jid)).slice(0, 12);

    // Return already cached valid URLs
    for (const jid of jids) {
      const cached = picMemoryCache.get(jid);
      if (cached) out[jid] = cached;
    }

    if (toFetch.length === 0) return out;

    await Promise.allSettled(
      toFetch.map(async jid => {
        const url = await this.fetchProfilePicture(sessionName, jid);
        if (url) out[jid] = url;
      })
    );

    return out;
  },

  /**
   * Fetches real WhatsApp chats, unifies LID with phone JIDs, and enriches with contact names & photos
   */
  async getRealChats(sessionName: string = '3c_vendedor'): Promise<any[]> {
    try {
      // Hydrate caches from localStorage
      const storedLids = loadLocalCache(`3c_lid_map_${sessionName}`);
      for (const [k, v] of Object.entries(storedLids)) {
        lidMemoryCache.set(k, v);
      }
      const storedNames = loadLocalCache(`3c_name_cache_${sessionName}`);
      for (const [k, v] of Object.entries(storedNames)) {
        if (isValidContactName(v)) nameMemoryCache.set(k, v);
      }
      const storedPics = loadLocalCache(`3c_pic_cache_${sessionName}`);
      for (const [k, v] of Object.entries(storedPics)) {
        picMemoryCache.set(k, v === 'NONE' ? null : v);
      }

      // Trigger background group LID discovery
      this.syncGroupLidMappings(sessionName);

      const [chatsRes, contactsRes, incomingMsgsRes] = await Promise.allSettled([
        fetch(`${EVOLUTION_API_URL}/chat/findChats/${sessionName}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }),
        fetch(`${EVOLUTION_API_URL}/chat/findContacts/${sessionName}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }),
        fetch(`${EVOLUTION_API_URL}/chat/findMessages/${sessionName}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            where: {
              key: {
                fromMe: false,
              },
            },
            limit: 150,
          }),
        }),
      ]);

      let chats: any[] = [];
      if (chatsRes.status === 'fulfilled' && chatsRes.value.ok) {
        const raw = await chatsRes.value.json();
        if (Array.isArray(raw)) chats = raw;
      }

      // Extract LID -> Phone mappings and contact names from recent incoming messages
      if (incomingMsgsRes.status === 'fulfilled' && incomingMsgsRes.value.ok) {
        try {
          const msgData = await incomingMsgsRes.value.json();
          const records = msgData?.messages?.records || (Array.isArray(msgData) ? msgData : []);
          let namesUpdated = false;
          let lidsUpdated = false;

          for (const m of records) {
            const jid = m.key?.remoteJid;
            const alt = m.key?.remoteJidAlt || m.key?.participantAlt;
            if (jid?.includes('@lid') && alt?.includes('@s.whatsapp.net')) {
              lidMemoryCache.set(jid, alt);
              storedLids[jid] = alt;
              lidsUpdated = true;
            }
            if (!m.key?.fromMe && isValidContactName(m.pushName)) {
              const validPush = m.pushName.trim();
              if (jid && !jid.includes('@g.us')) {
                nameMemoryCache.set(jid, validPush);
                storedNames[jid] = validPush;
                namesUpdated = true;
              }
              if (alt && !alt.includes('@g.us')) {
                nameMemoryCache.set(alt, validPush);
                storedNames[alt] = validPush;
                namesUpdated = true;
              }
            }
          }
          if (lidsUpdated) saveLocalCache(`3c_lid_map_${sessionName}`, storedLids);
          if (namesUpdated) saveLocalCache(`3c_name_cache_${sessionName}`, storedNames);
        } catch {
          // ignore
        }
      }

      const contactsMap = new Map<string, { name: string | null; profilePicUrl?: string | null }>();
      if (contactsRes.status === 'fulfilled' && contactsRes.value.ok) {
        try {
          const rawContacts = await contactsRes.value.json();
          if (Array.isArray(rawContacts)) {
            for (const c of rawContacts) {
              const rawName = isValidContactName(c.pushName) ? c.pushName.trim() : (isValidContactName(c.name) ? c.name.trim() : null);
              const pic = c.profilePicUrl || null;
              if (c.remoteJid) {
                const prev = contactsMap.get(c.remoteJid);
                contactsMap.set(c.remoteJid, {
                  name: rawName || prev?.name || null,
                  profilePicUrl: pic || prev?.profilePicUrl || null,
                });
                if (c.remoteJid.includes('@s.whatsapp.net')) {
                  const digits = c.remoteJid.split('@')[0].replace(/\D/g, '');
                  contactsMap.set(digits, {
                    name: rawName || prev?.name || null,
                    profilePicUrl: pic || prev?.profilePicUrl || null,
                  });
                  if (digits.length >= 8) {
                    contactsMap.set(digits.slice(-8), {
                      name: rawName || prev?.name || null,
                      profilePicUrl: pic || prev?.profilePicUrl || null,
                    });
                  }
                }
              }
            }
          }
        } catch {
          // ignore
        }
      }

      // Filter out WhatsApp groups, status broadcasts, self-test chat, and empty placeholder/protocol records
      const nonGroups = chats.filter((c: any) => {
        if (!c.remoteJid || c.remoteJid.includes('@g.us') || c.remoteJid.includes('broadcast')) return false;
        const msgType = c.lastMessage?.messageType;
        if (msgType === 'placeholderMessage' || msgType === 'protocolMessage') return false;
        return true;
      });

      // Discover additional LID -> Phone mappings from chat lastMessage keys
      for (const c of nonGroups) {
        const alt = c.lastMessage?.key?.remoteJidAlt || c.lastMessage?.key?.participantAlt;
        if (c.remoteJid.includes('@lid') && alt && alt.includes('@s.whatsapp.net')) {
          lidMemoryCache.set(c.remoteJid, alt);
        }
      }

      // Unify chats by canonical phone JID so incoming LID and outgoing phone JID merge into one
      const unifiedMap = new Map<string, {
        canonicalJid: string;
        allJids: string[];
        chat: any;
        lastTimestamp: number;
      }>();

      for (const c of nonGroups) {
        let canonicalJid = c.remoteJid;
        const isLid = c.remoteJid.includes('@lid');

        if (isLid) {
          const alt = c.lastMessage?.key?.remoteJidAlt || c.lastMessage?.key?.participantAlt || lidMemoryCache.get(c.remoteJid);
          if (alt && alt.includes('@s.whatsapp.net')) {
            canonicalJid = alt;
          }
        }

        const existing = unifiedMap.get(canonicalJid);
        const curTimestamp = new Date(c.updatedAt || c.lastMessage?.messageTimestamp * 1000 || 0).getTime();

        if (!existing) {
          unifiedMap.set(canonicalJid, {
            canonicalJid,
            allJids: [c.remoteJid],
            chat: c,
            lastTimestamp: curTimestamp,
          });
        } else {
          if (!existing.allJids.includes(c.remoteJid)) {
            existing.allJids.push(c.remoteJid);
          }
          if (curTimestamp > existing.lastTimestamp) {
            existing.chat = c;
            existing.lastTimestamp = curTimestamp;
          }
        }
      }

      // Format unified conversations
      const formattedList = Array.from(unifiedMap.values()).map(({ canonicalJid, allJids, chat: c }) => {
        let rawPhone = '';
        let formattedPhone = '';

        if (canonicalJid.includes('@s.whatsapp.net')) {
          const raw = canonicalJid.split('@')[0].replace(/\D/g, '');
          rawPhone = raw;
          let phoneClean = raw;
          if (phoneClean.startsWith('55') && phoneClean.length >= 12) {
            phoneClean = phoneClean.slice(2);
          }
          if (phoneClean.length >= 10 && phoneClean.length <= 11) {
            const ddd = phoneClean.slice(0, 2);
            const num = phoneClean.slice(2);
            formattedPhone = num.length === 9 
              ? `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
              : `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
          } else {
            formattedPhone = `+${raw}`;
          }
        }

        const jidCandidates = Array.from(new Set([canonicalJid, ...allJids]));

        // Resolve Contact Name:
        // 1. From contactsMap (saved contacts in WhatsApp)
        // 2. From nameMemoryCache (learned from incoming messages)
        // 3. From chat's lastMessage pushName (if fromMe === false and valid name)
        // 4. From chat's pushName (if valid name)
        let resolvedName = '';
        for (const jid of jidCandidates) {
          const info = contactsMap.get(jid);
          if (info?.name && isValidContactName(info.name)) {
            resolvedName = info.name;
            break;
          }
        }

        if (!resolvedName && rawPhone) {
          const info = contactsMap.get(rawPhone) || (rawPhone.length >= 8 ? contactsMap.get(rawPhone.slice(-8)) : null);
          if (info?.name && isValidContactName(info.name)) {
            resolvedName = info.name;
          }
        }

        if (!resolvedName) {
          for (const jid of jidCandidates) {
            const cachedName = nameMemoryCache.get(jid);
            if (cachedName && isValidContactName(cachedName)) {
              resolvedName = cachedName;
              break;
            }
          }
        }

        if (!resolvedName && c.lastMessage?.key?.fromMe === false && isValidContactName(c.lastMessage?.pushName)) {
          resolvedName = c.lastMessage.pushName.trim();
        }

        if (!resolvedName && isValidContactName(c.pushName)) {
          resolvedName = c.pushName.trim();
        }

        const hasHumanName = Boolean(resolvedName);
        if (!resolvedName) {
          resolvedName = formattedPhone || 'Contato WhatsApp';
        }

        // Resolve Profile Picture
        let picUrl = c.profilePicUrl || null;
        if (!picUrl) {
          for (const jid of jidCandidates) {
            const info = contactsMap.get(jid);
            if (info?.profilePicUrl) {
              picUrl = info.profilePicUrl;
              break;
            }
            const cachedPic = picMemoryCache.get(jid);
            if (cachedPic) {
              picUrl = cachedPic;
              break;
            }
          }
        }

        // Parse last message text (including templateMessage)
        let lastMsg = '';
        const lastTime = c.updatedAt || (c.lastMessage?.messageTimestamp ? new Date(c.lastMessage.messageTimestamp * 1000).toISOString() : new Date().toISOString());

        if (c.lastMessage?.message) {
          const m = c.lastMessage.message;
          const tplText = m.templateMessage?.hydratedFourRowTemplate?.hydratedContentText ||
                          m.templateMessage?.interactiveMessageTemplate?.body?.text ||
                          '';
          lastMsg = m.conversation || 
                    m.extendedTextMessage?.text || 
                    m.imageMessage?.caption || 
                    tplText ||
                    (m.audioMessage ? '🎤 Mensagem de áudio' : '') ||
                    (m.imageMessage ? '📷 Imagem' : '') ||
                    (m.documentMessage ? '📄 Documento' : '') ||
                    '';
        }

        return {
          id: canonicalJid,
          remoteJid: canonicalJid,
          allJids: jidCandidates,
          name: resolvedName,
          pushName: resolvedName,
          hasHumanName,
          phone: formattedPhone,
          rawPhone: rawPhone,
          unreadCount: c.unreadCount || 0,
          profilePicUrl: picUrl,
          lastMessage: lastMsg,
          lastMessageTimestamp: lastTime,
          lastMessageType: c.lastMessage?.messageType,
        };
      });

      // Filter out unmapped LID bot template messages that have neither a phone number nor a contact name
      const result = formattedList.filter(item => {
        if (item.remoteJid.includes('@lid') && !item.hasHumanName && item.lastMessageType === 'templateMessage') {
          return false;
        }
        return true;
      });

      // Sort by latest message descending
      result.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
      return result;
    } catch (err) {
      console.warn('Could not fetch real chats from Evolution API:', err);
      return [];
    }
  },

  /**
   * Fetches real messages for a specific WhatsApp chat (supports single JID or array of unified JIDs)
   */
  async getRealMessages(sessionName: string, remoteJids: string | string[], leadId?: string): Promise<WhatsAppMessage[]> {
    const jidList = Array.isArray(remoteJids) ? remoteJids : [remoteJids];
    let evolutionMsgs: WhatsAppMessage[] = [];

    try {
      const results = await Promise.allSettled(
        jidList.map(jid => 
          fetch(`${EVOLUTION_API_URL}/chat/findMessages/${sessionName}`, {
            method: 'POST',
            headers: {
              'apikey': EVOLUTION_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              where: {
                key: {
                  remoteJid: jid,
                },
              },
            }),
          }).then(r => r.ok ? r.json() : [])
        )
      );

      const storedNames = loadLocalCache(`3c_name_cache_${sessionName}`);
      let namesUpdated = false;

      for (const res of results) {
        if (res.status === 'fulfilled') {
          const data = res.value;
          const records = data.messages?.records || (Array.isArray(data) ? data : []);
          const parsed = records.map((m: any) => {
            const msgObj = m.message || {};
            const isAudio = Boolean(msgObj.audioMessage);
            const isImage = Boolean(msgObj.imageMessage);
            const isDoc = Boolean(msgObj.documentMessage);
            const audioSec = msgObj.audioMessage?.seconds || 0;

            const tplText = msgObj.templateMessage?.hydratedFourRowTemplate?.hydratedContentText ||
                            msgObj.templateMessage?.interactiveMessageTemplate?.body?.text ||
                            '';

            const text = msgObj.conversation || 
                         msgObj.extendedTextMessage?.text || 
                         msgObj.imageMessage?.caption || 
                         tplText ||
                         (isAudio ? '🎤 Mensagem de áudio' : '') ||
                         (isImage ? '📷 Imagem' : '') ||
                         (isDoc ? '📄 Documento' : '') ||
                         '';

            const validSender = (!m.key?.fromMe && isValidContactName(m.pushName)) ? m.pushName.trim() : undefined;
            if (validSender) {
              for (const j of jidList) {
                nameMemoryCache.set(j, validSender);
                if (storedNames[j] !== validSender) {
                  storedNames[j] = validSender;
                  namesUpdated = true;
                }
              }
            }

            return {
              id: m.key?.id || m.id || String(Math.random()),
              leadId: leadId || jidList[0],
              fromMe: Boolean(m.key?.fromMe),
              senderName: validSender,
              text: text,
              mediaType: isAudio ? 'audio' : (isImage ? 'image' : (isDoc ? 'document' : undefined)),
              audioDuration: isAudio ? audioSec : undefined,
              audioUrl: msgObj.audioMessage?.url || undefined,
              timestamp: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toISOString() : (m.createdAt || new Date().toISOString()),
              status: m.status === 'READ' ? 'read' : 'delivered',
            };
          }).filter((m: any) => m.text || m.mediaType);

          evolutionMsgs.push(...parsed);
        }
      }

      if (namesUpdated) {
        saveLocalCache(`3c_name_cache_${sessionName}`, storedNames);
      }
    } catch (err) {
      console.warn('Could not fetch messages from Evolution API:', err);
    }

    // Also get Supabase messages for leadId if present
    let supabaseMsgs: WhatsAppMessage[] = [];
    if (leadId) {
      try {
        supabaseMsgs = await this.getMessages(leadId);
      } catch {
        // ignore
      }
    }

    // Merge and deduplicate by id or text+fromMe
    const combined = [...evolutionMsgs, ...supabaseMsgs];
    const seen = new Set<string>();
    const unique: WhatsAppMessage[] = [];
    for (const msg of combined) {
      const key = msg.id || `${msg.fromMe}_${msg.text}_${msg.timestamp.slice(0, 16)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(msg);
      }
    }

    unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return unique;
  },

  /**
   * Fetches the base64 data for an audio or media message from Evolution API
   */
  async getMediaBase64(sessionName: string, messageId: string): Promise<{ base64: string; mimetype: string } | null> {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${sessionName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            key: {
              id: messageId,
            },
          },
          convertToMp4: false,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        base64: data.base64,
        mimetype: data.mimetype || 'audio/ogg; codecs=opus',
      };
    } catch (err) {
      console.warn('Error fetching media base64 from Evolution API:', err);
      return null;
    }
  },

  /**
   * Sends a voice note / audio message via Evolution API and logs into Supabase
   */
  async sendAudioMessage(
    sessionName: string,
    phoneNumber: string,
    base64Audio: string,
    corretorId?: string,
    leadId?: string,
    durationSeconds: number = 0
  ): Promise<WhatsAppMessage | null> {
    try {
      const targetNumber = formatTargetNumber(phoneNumber);
      // Evolution API requires pure base64 without the 'data:audio/webm;codecs=opus;base64,' prefix
      const pureBase64 = base64Audio.includes('base64,') ? base64Audio.split('base64,')[1] : base64Audio;

      const res = await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${sessionName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: targetNumber,
          audio: pureBase64,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Evolution API sendWhatsAppAudio failed:', res.status, errText);
        return null;
      }

      const resData = await res.json();
      const msgId = resData?.key?.id || `audio-${Date.now()}`;
      const timestamp = new Date().toISOString();

      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
      const validLeadId = isUuid(leadId) ? leadId : null;

      if (isSupabaseConfigured) {
        try {
          await supabase.from('whatsapp_messages').insert([{
            lead_id: validLeadId,
            corretor_id: corretorId || null,
            remetente_tipo: 'corretor',
            mensagem: '🎤 Mensagem de áudio',
            midia_url: null,
            enviada_at: timestamp,
            status_envio: 'sent',
          }]);
        } catch {
          // ignore
        }

        if (validLeadId) {
          try {
            await supabase.from('leads').update({
              ultima_interacao_at: timestamp,
            }).eq('id', validLeadId);
          } catch {
            // ignore
          }
        }
      }

      return {
        id: msgId,
        leadId: leadId || targetNumber,
        corretorId: corretorId,
        fromMe: true,
        text: '🎤 Mensagem de áudio',
        mediaType: 'audio',
        audioDuration: durationSeconds,
        audioUrl: base64Audio,
        timestamp: timestamp,
        status: 'delivered',
      };
    } catch (err) {
      console.error('Error sending audio message:', err);
      return null;
    }
  },

  /**
   * Fetches all messages for a specific lead, ordered chronologically
   */
  async getMessages(leadId: string): Promise<WhatsAppMessage[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('enviada_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      leadId: row.lead_id,
      corretorId: row.corretor_id,
      fromMe: row.remetente_tipo === 'corretor',
      text: row.mensagem,
      mediaUrl: row.midia_url,
      timestamp: row.enviada_at,
      status: (row.status_envio as any) || 'read',
    }));
  },

  /**
   * Sends a message from the corretor to the lead, saving to Supabase and dispatching via Evolution API
   */
  async sendMessage(
    leadId: string, 
    text: string, 
    sessionName: string = '3c_vendedor', 
    corretorId?: string, 
    mediaUrl?: string,
    customPhone?: string
  ): Promise<WhatsAppMessage> {
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    const validLeadId = isUuid(leadId) ? leadId : null;

    let targetPhone = customPhone;

    if (!targetPhone && validLeadId && isSupabaseConfigured) {
      try {
        const { data: lead } = await supabase
          .from('leads')
          .select('telefone')
          .eq('id', validLeadId)
          .maybeSingle();

        if (lead?.telefone) {
          targetPhone = lead.telefone;
        }
      } catch (e) {
        // ignore
      }
    }

    // Dispatch to real WhatsApp phone via Evolution API
    if (targetPhone) {
      try {
        await this.sendEvolutionMessage(sessionName, targetPhone, text);
      } catch (e) {
        console.warn('Could not forward message to Evolution API:', e);
      }
    }

    let insertedId = `msg-${Date.now()}`;
    let insertedTime = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const payload = {
          lead_id: validLeadId,
          corretor_id: corretorId || null,
          remetente_tipo: 'corretor',
          mensagem: text,
          midia_url: mediaUrl || null,
          enviada_at: insertedTime,
          status_envio: 'sent',
        };

        const { data } = await supabase
          .from('whatsapp_messages')
          .insert([payload])
          .select()
          .single();

        if (data) {
          insertedId = data.id;
          insertedTime = data.enviada_at;
        }
      } catch (err) {
        console.warn('Could not save message to Supabase:', err);
      }

      if (validLeadId) {
        try {
          await supabase
            .from('leads')
            .update({ ultima_interacao_at: new Date().toISOString() })
            .eq('id', validLeadId);
        } catch (e) {
          // ignore
        }
      }
    }

    return {
      id: insertedId,
      leadId: leadId,
      corretorId: corretorId,
      fromMe: true,
      text: text,
      mediaUrl: mediaUrl,
      timestamp: insertedTime,
      status: 'delivered',
    };
  },

  /**
   * Simulates an incoming message from the lead (useful for testing two-way real-time mirroring)
   */
  async simulateIncomingMessage(leadId: string, text: string): Promise<WhatsAppMessage> {
    const payload = {
      lead_id: leadId,
      corretor_id: null,
      remetente_tipo: 'lead',
      mensagem: text,
      enviada_at: new Date().toISOString(),
      status_envio: 'read',
    };

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error simulating incoming message:', error);
      throw error;
    }

    await supabase
      .from('leads')
      .update({ ultima_interacao_at: new Date().toISOString() })
      .eq('id', leadId);

    return {
      id: data.id,
      leadId: data.lead_id,
      fromMe: false,
      text: data.mensagem,
      timestamp: data.enviada_at,
      status: 'read',
    };
  },

  /**
   * Gets or initializes the WhatsApp instance status for the broker
   */
  async getInstanceStatus(corretorEmail: string = 'corretor@grupo3c.com.br', corretorId?: string): Promise<WhatsAppInstance> {
    if (!isSupabaseConfigured) {
      return {
        id: 'demo-inst',
        sessionName: '3c_vendedor',
        status: 'disconnected'
      };
    }

    const cleanSessionName = `3c_${corretorEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')}`;

    // Auto-ensure instance on Evolution API
    await this.ensureInstance(cleanSessionName);

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .or(`corretor_email.eq.${corretorEmail},session_name.eq.${cleanSessionName}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching whatsapp instance:', error);
    }

    let instanceRow = data;

    if (!instanceRow) {
      const newInstance = {
        corretor_id: corretorId || null,
        corretor_email: corretorEmail,
        session_name: cleanSessionName,
        status: 'disconnected',
      };

      const { data: created } = await supabase
        .from('whatsapp_instances')
        .insert([newInstance])
        .select()
        .single();
      instanceRow = created;
    }

    let currentStatus = instanceRow?.status || 'disconnected';
    let currentPhone = instanceRow?.phone_number || null;
    let currentQr = instanceRow?.qrcode_base64 || null;

    try {
      const liveState = await this.checkLiveConnectionState(cleanSessionName);
      if (liveState === 'open') {
        currentStatus = 'connected';
        const detectedPhone = await this.getConnectedPhone(cleanSessionName);
        if (detectedPhone) {
          currentPhone = detectedPhone;
        }
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            phone_number: currentPhone,
            qrcode_base64: null,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', instanceRow.id);
      } else {
        // WhatsApp is NOT connected in Evolution API: keep as disconnected and fetch fresh QR code
        currentStatus = 'disconnected';
        currentPhone = null;
        currentQr = await this.fetchLiveQrCode(cleanSessionName);
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'disconnected',
            phone_number: null,
            qrcode_base64: currentQr,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', instanceRow.id);
      }
    } catch (err) {
      console.warn('Error checking live Evolution instance state:', err);
    }

    return {
      id: instanceRow?.id || 'inst-1',
      corretorId: instanceRow?.corretor_id,
      sessionName: cleanSessionName,
      phoneNumber: currentPhone,
      status: currentStatus,
      qrcodeBase64: currentQr,
      connectedAt: instanceRow?.connected_at,
      lastSyncAt: instanceRow?.last_sync_at,
    };
  },

  /**
   * Connects the instance (supports demo one-click or QR code scanning)
   */
  async setInstanceConnected(instanceId: string, phoneNumber: string = '(11) 98765-4321'): Promise<void> {
    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'connected',
        phone_number: phoneNumber,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        qrcode_base64: null,
      })
      .eq('id', instanceId);
  },

  /**
   * Disconnects the WhatsApp instance from both Evolution API and Supabase
   */
  async disconnectInstance(instanceId: string, sessionName: string = '3c_vendedor'): Promise<void> {
    try {
      await fetch(`${EVOLUTION_API_URL}/instance/logout/${sessionName}`, {
        method: 'DELETE',
        headers: { apikey: EVOLUTION_API_KEY },
      });
    } catch (err) {
      console.warn('Error logging out from Evolution API:', err);
    }

    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        phone_number: null,
        qrcode_base64: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instanceId);
  },

  /**
   * Pre-formatted quick real estate response templates for brokers
   */
  getQuickTemplates(lead?: Lead | null) {
    const nome = lead?.nome ? lead.nome.split(' ')[0] : 'Cliente';
    const emp = lead?.empreendimentoInteresse || 'nossos lançamentos em São Paulo';
    const parcela = lead?.rendaMensal ? `R$ ${(lead.rendaMensal * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'uma parcela que cabe no seu bolso';

    return [
      {
        id: 'apresentacao',
        titulo: 'Apresentação do Projeto',
        texto: `Olá ${nome}! Tudo bem? Sou da equipe do *Grupo 3C Imobiliária*. Estou entrando em contato sobre o *${emp}*! Temos condições exclusivas pelo programa Minha Casa Minha Vida com subsídio e entrada parcelada direto com a construtora. Gostaria de receber o book de fotos e plantas no seu WhatsApp?`,
      },
      {
        id: 'docs_caixa',
        titulo: 'Lista de Docs Caixa',
        texto: `Olá ${nome}! Para fazermos a sua análise de crédito com a Caixa Econômica Federal e garantir a taxa de juros mais baixa do mercado, precisamos dos seguintes documentos básicos:\n\n1. RG ou CNH (frente e verso)\n2. Comprovante de Residência recente (últimos 60 dias)\n3. 3 últimos Holerites\n4. Extrato do FGTS com saldo\n5. Certidão de Estado Civil (Nascimento ou Casamento)\n6. Declaração do Imposto de Renda (se declarar)\n\nPode me enviar por foto ou PDF aqui mesmo pelo WhatsApp! 👍`,
      },
      {
        id: 'visita',
        titulo: 'Convite / Confirmação de Visita',
        texto: `Olá ${nome}! O que acha de darmos um pulo no plantão do *${emp}* para você conhecer o apartamento decorado em tamanho real e tirar todas as dúvidas? Posso agendar para você amanhã ou no próximo sábado! Qual horário fica melhor para você?`,
      },
      {
        id: 'simulacao',
        titulo: 'Simulação de Financiamento',
        texto: `Olá ${nome}! Fizemos um estudo prévio do seu perfil com base na sua renda: sua parcela máxima estimada pelo Minha Casa Minha Vida fica em torno de *${parcela}* mensais! E podemos usar o seu saldo de FGTS para abater a entrada. Ficou com alguma dúvida sobre o fluxo?`,
      },
      {
        id: 'localizacao',
        titulo: 'Localização do Plantão',
        texto: `Segue o endereço do nosso plantão de vendas do *${emp}*! Temos estacionamento no local e atendimento com café e maquete completa. Quando estiver a caminho, me avise para eu te recepcionar na portaria! 🏢✨`,
      }
    ];
  }
};
