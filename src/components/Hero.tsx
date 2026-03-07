import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    VANTA: any;
  }
}

function Hero() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const scrollAnimationFrame = useRef<number | null>(null);
  const [dateTime, setDateTime] = useState<string>('');
  const [nowPlaying, setNowPlaying] = useState<string>('Not playing');
  const [weather, setWeather] = useState<string>('Loading...');
  const [countdown, setCountdown] = useState<string>('Loading...');
  const [todayFood, setTodayFood] = useState<string>('Loading...');

  useEffect(() => {
    if (window.VANTA && vantaRef.current && !vantaEffect.current) {
      vantaEffect.current = window.VANTA.NET({
        el: vantaRef.current,
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

      if (scrollAnimationFrame.current !== null) {
        cancelAnimationFrame(scrollAnimationFrame.current);
        scrollAnimationFrame.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString('en-US', {
        weekday: 'long'
      });
      const time = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setDateTime(`${weekday}\n${time}`);
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
    const proxyPrefix = 'https://corsproxy.io/?';
    const today = new Date().toISOString().slice(0, 10);

    const fetchWithFallback = async (url: string) => {
      try {
        const direct = await fetch(url);
        if (direct.ok) {
          return direct;
        }
      } catch {
        // Fallback to proxy if direct call fails (usually CORS).
      }

      return fetch(`${proxyPrefix}${encodeURIComponent(url)}`);
    };

    const decodeHtml = (value: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'text/html');
      return (doc.documentElement.textContent || '').trim();
    };

    const fetchTodayFood = async () => {
      try {
        const dinerGroupsUrl = `${base}/api/GetRestaurantPublicDinerGroups?id=${restaurantId}&startDate=${today}&endDate=${today}`;
        const dinerGroupResponse = await fetchWithFallback(dinerGroupsUrl);

        if (!dinerGroupResponse.ok) {
          setTodayFood('Unavailable');
          return;
        }

        const dinerGroups = await dinerGroupResponse.json();
        const feedId = Array.isArray(dinerGroups) && dinerGroups.length > 0 ? dinerGroups[0]?.Id : null;

        if (!feedId) {
          setTodayFood('No menu found');
          return;
        }

        const rssUrl = `${base}/api/Common/Restaurant/GetRssFeed/${feedId}/0`;
        const rssResponse = await fetchWithFallback(rssUrl);

        if (!rssResponse.ok) {
          setTodayFood('Unavailable');
          return;
        }

        const xmlText = await rssResponse.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
        const descriptionNode = xmlDoc.querySelector('channel > item > description');
        const descriptionRaw = descriptionNode?.textContent?.trim() || '';

        if (!descriptionRaw) {
          setTodayFood('No menu found');
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
        
        setTodayFood(formatted.trim() || 'No menu found');
      } catch {
        setTodayFood('Unavailable');
      }
    };

    fetchTodayFood();
  }, []);

  const scrollToBottom = () => {
    if (scrollAnimationFrame.current !== null) {
      cancelAnimationFrame(scrollAnimationFrame.current);
      scrollAnimationFrame.current = null;
    }

    const startY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const targetY = Math.max(0, documentHeight - viewportHeight);
    const distance = targetY - startY;

    if (distance <= 0) {
      return;
    }

    const durationMs = 600;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        scrollAnimationFrame.current = requestAnimationFrame(animate);
      } else {
        scrollAnimationFrame.current = null;
      }
    };

    scrollAnimationFrame.current = requestAnimationFrame(animate);
  };

  return (
    <section className="hero">
      <div className="hero-top" ref={vantaRef}>
        <h1 style={{ whiteSpace: 'pre-line' }}>{dateTime}</h1>

        <div className="purple-divider"></div>

        <div className="icon-links">
          <a href="https://steamcommunity.com/profiles/76561198971745350" target="_blank" rel="noopener noreferrer" className="icon-link">
            <i className="fab fa-steam icon"></i>
            Steam
          </a>
          <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="icon-link">
            <i className="fab fa-twitter icon"></i>
            X
          </a>
          <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="icon-link">
            <i className="fab fa-youtube icon"></i>
            YouTube
          </a>
          <a href="https://www.chess.com/member/imaginelos1ng" target="_blank" rel="noopener noreferrer" className="icon-link">
            <i className="fas fa-chess icon"></i>
            Chess
          </a>
        </div>

        <button
          type="button"
          className="scroll-to-bottom"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <i className="fas fa-angle-double-down" aria-hidden="true"></i>
        </button>
      </div>

      <div className="rapid-section" aria-live="polite">
        <div className="menu-column">
          <div className="rapid-rating rapid-rating-menu">
            <i className="fas fa-utensils rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Today's Food</p>
            <p className="rapid-rating-menu-text">{todayFood}</p>
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