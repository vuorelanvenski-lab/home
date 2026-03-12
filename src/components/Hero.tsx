import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    VANTA: any;
  }
}

function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const vantaEffect = useRef<any>(null);
  const [weekday, setWeekday] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [nowPlaying, setNowPlaying] = useState<string>('Not playing');
  const [weather, setWeather] = useState<string>('Loading...');
  const [countdown, setCountdown] = useState<string>('Loading...');
  const [todayFood, setTodayFood] = useState<string>('Loading...');

  useEffect(() => {
    if (window.VANTA && heroRef.current && !vantaEffect.current) {
      vantaEffect.current = window.VANTA.NET({
        el: heroRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x8411d1,
        backgroundColor: 0x0,
        points: 17.00,
        maxDistance: 10.00,
        spacing: 20.00
      });
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const weekdayStr = now.toLocaleDateString('en-US', {
        weekday: 'long'
      });
      const timeStr = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setWeekday(weekdayStr);
      setTime(timeStr);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_LASTFM_API_KEY;
    const username = process.env.REACT_APP_LASTFM_USERNAME;

    if (!apiKey || !username) {
      setNowPlaying('Set API key');
      return;
    }

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`
        );

        if (!response.ok) {
          setNowPlaying('Unavailable');
          return;
        }

        const data = await response.json();
        // Last.fm returns track as object when limit=1, or array when multiple
        const trackData = data?.recenttracks?.track;
        const track = Array.isArray(trackData) ? trackData[0] : trackData;

        if (!track) {
          setNowPlaying('No track');
          return;
        }

        const isNowPlaying = track['@attr']?.nowplaying === 'true';
        const artist = track.artist?.['#text'] || track.artist || 'Unknown Artist';
        const songName = track.name || 'Unknown Track';

        if (isNowPlaying) {
          setNowPlaying(`${artist} - ${songName}`);
        } else {
          setNowPlaying('Not playing');
        }
      } catch {
        setNowPlaying('Unavailable');
      }
    };

    fetchNowPlaying();
    // Update every 15 seconds to show current track
    const interval = setInterval(fetchNowPlaying, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targetDate = new Date('2026-09-16T00:00:00');

    const updateCountdown = () => {
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown('0 days');
        return;
      }

      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setCountdown(`${days} days`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Kajaani, Finland coordinates: 64.2222°N, 27.7286°E
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=64.2222&longitude=27.7286&current_weather=true'
        );

        if (!response.ok) {
          setWeather('Unavailable');
          return;
        }

        const data = await response.json();
        const temp = data?.current_weather?.temperature;

        if (typeof temp === 'number') {
          setWeather(`${Math.round(temp)}°C`);
        } else {
          setWeather('No data');
        }
      } catch {
        setWeather('Unavailable');
      }
    };

    fetchWeather();
    // Update weather every 10 minutes
    const interval = setInterval(fetchWeather, 600000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const restaurantId = 'c9266fa6-dd31-4800-92b2-1a41b6267613';
    const base = 'https://menu.leijonacatering.fi/AromieMenus/FI/Default/Leijona/HoikanhoviKajaani';
    const proxyOptions = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url='
    ];
    const today = new Date().toISOString().slice(0, 10);
    const TIMEOUT_MS = 8000;
    const MAX_RETRIES = 2;

    const fetchWithTimeout = async (url: string, timeoutMs: number = TIMEOUT_MS): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        return await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const fetchWithFallback = async (url: string, retryCount = 0): Promise<Response> => {
      // Try direct fetch first
      try {
        const direct = await fetchWithTimeout(url);
        if (direct.ok) {
          return direct;
        }
      } catch (err) {
        // Direct fetch failed, proceed to proxies
      }

      // Try each proxy in sequence
      for (const proxy of proxyOptions) {
        try {
          const proxied = await fetchWithTimeout(`${proxy}${encodeURIComponent(url)}`);
          if (proxied.ok) {
            return proxied;
          }
        } catch {
          // Continue to next proxy
          continue;
        }
      }

      // If all attempts failed and we have retries left, wait and retry
      if (retryCount < MAX_RETRIES) {
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return fetchWithFallback(url, retryCount + 1);
      }

      // Create a failed response
      throw new Error(`Failed to fetch after ${MAX_RETRIES} retries and ${proxyOptions.length} proxies`);
    };

    const decodeHtml = (value: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'text/html');
      return (doc.documentElement.textContent || '').trim();
    };

    const fetchTodayFood = async () => {
      try {
        const dinerGroupsUrl = `${base}/api/GetRestaurantPublicDinerGroups?id=${restaurantId}&startDate=${today}&endDate=${today}`;
        
        let dinerGroupResponse;
        try {
          dinerGroupResponse = await fetchWithFallback(dinerGroupsUrl);
        } catch (err) {
          setTodayFood('Menu service unavailable');
          return;
        }

        if (!dinerGroupResponse.ok) {
          setTodayFood('Menu service error');
          return;
        }

        let dinerGroups;
        try {
          dinerGroups = await dinerGroupResponse.json();
        } catch {
          setTodayFood('Invalid menu format');
          return;
        }

        const feedId = Array.isArray(dinerGroups) && dinerGroups.length > 0 ? dinerGroups[0]?.Id : null;

        if (!feedId) {
          setTodayFood('No menu for today');
          return;
        }

        const rssUrl = `${base}/api/Common/Restaurant/GetRssFeed/${feedId}/0`;
        let rssResponse;
        try {
          rssResponse = await fetchWithFallback(rssUrl);
        } catch (err) {
          setTodayFood('Feed unavailable');
          return;
        }

        if (!rssResponse.ok) {
          setTodayFood('Feed error');
          return;
        }

        let xmlText;
        try {
          xmlText = await rssResponse.text();
        } catch {
          setTodayFood('Feed read error');
          return;
        }

        const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
        
        // Check for XML parse errors
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
          setTodayFood('Invalid feed format');
          return;
        }

        const descriptionNode = xmlDoc.querySelector('channel > item > description');
        const descriptionRaw = descriptionNode?.textContent?.trim() || '';

        if (!descriptionRaw) {
          setTodayFood('No menu items found');
          return;
        }

        let plain = decodeHtml(descriptionRaw).replace(/\s*\n\s*/g, '\n').trim();
        
        // Format menu into clean sections (Finnish names)
        const sections = ['Aamupala', 'Lounas', 'Päivällinen', 'Iltapala'];
        let formatted = '';
        
        sections.forEach((section) => {
          const sectionRegex = new RegExp(`${section}:\\s*([^]*?)(?=(?:Aamupala:|Lounas:|Päivällinen:|Iltapala:|$))`, 'i');
          const match = plain.match(sectionRegex);
          
          if (match && match[1]?.trim()) {
            const items = match[1]
              .split('<br>')
              .map(item => item.trim())
              .filter(item => item && item.length > 0);
            
            if (items.length > 0) {
              formatted += `${section}:\n`;
              items.forEach(item => {
                formatted += `• ${item}\n`;
              });
              formatted += '\n';
            }
          }
        });
        
        setTodayFood(formatted.trim() || 'No menu items found');
      } catch (err) {
        setTodayFood('Menu load failed');
      }
    };

    fetchTodayFood();
    // Update food menu every 2 hours
    const foodInterval = setInterval(fetchTodayFood, 2 * 60 * 60 * 1000);
    return () => clearInterval(foodInterval);
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="rapid-section" aria-live="polite">
        <div className="food-time-container">
          <div className="weekday-display">
            {weekday}
          </div>

          <div className="menu-column">
            <div className="rapid-rating rapid-rating-menu">
              <i className="fas fa-utensils rapid-rating-icon" aria-hidden="true"></i>
              <p className="rapid-rating-title">Today's Food</p>
              <p className="rapid-rating-menu-text">{todayFood}</p>
            </div>
          </div>

          <div className="time-display">
            {time}
          </div>
        </div>

        <div className="purple-divider"></div>

        <div className="stats-column" aria-live="polite">
          <div className="rapid-rating">
            <i className="fas fa-cloud-sun rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Kajaani</p>
            <p className="rapid-rating-value-static">{weather}</p>
          </div>

          <div className="rapid-rating">
            <i className="fas fa-music rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Now Playing</p>
            <div className="now-playing-ticker" aria-label={nowPlaying}>
              <span className="now-playing-text">{nowPlaying}</span>
            </div>
          </div>

          <div className="rapid-rating">
            <i className="fas fa-hourglass-half rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">TJ</p>
            <p className="rapid-rating-value-static">{countdown}</p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;
export {};