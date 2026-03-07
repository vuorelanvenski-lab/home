import React, { useEffect, useRef, useState } from 'react';

type MarketQuote = {
  price: string;
  changePct: number | null;
  history: number[];
};

function FunStuff() {
  const vantaRef = useRef<HTMLElement | null>(null);
  const vantaEffect = useRef<any>(null);
  const [apodTitle, setApodTitle] = useState<string>('Loading...');
  const [apodImageUrl, setApodImageUrl] = useState<string>('');
  const [apodPageUrl, setApodPageUrl] = useState<string>('https://apod.nasa.gov/apod/');
  const [chuckJoke, setChuckJoke] = useState<string>('Loading...');
  const [pokemonName, setPokemonName] = useState<string>('Loading...');
  const [pokemonImage, setPokemonImage] = useState<string>('');
  const [pokemonNumber, setPokemonNumber] = useState<number | null>(null);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, MarketQuote>>({
    BTC: { price: 'Loading...', changePct: null, history: [] },
    ETH: { price: 'Loading...', changePct: null, history: [] },
    SOL: { price: 'Loading...', changePct: null, history: [] },
    XRP: { price: 'Loading...', changePct: null, history: [] },
    LTC: { price: 'Loading...', changePct: null, history: [] }
  });
  const [stockPrices, setStockPrices] = useState<Record<string, MarketQuote>>({
    NVDA: { price: 'Loading...', changePct: null, history: [] },
    AMD: { price: 'Loading...', changePct: null, history: [] },
    AMZN: { price: 'Loading...', changePct: null, history: [] },
    MSFT: { price: 'Loading...', changePct: null, history: [] },
    TSLA: { price: 'Loading...', changePct: null, history: [] }
  });

  const cryptoLinks: Record<string, string> = {
    BTC: 'https://www.tradingview.com/symbols/BTCUSD/',
    ETH: 'https://www.tradingview.com/symbols/ETHUSD/',
    SOL: 'https://www.tradingview.com/symbols/SOLUSD/',
    XRP: 'https://www.tradingview.com/symbols/XRPUSD/',
    LTC: 'https://www.tradingview.com/symbols/LTCUSD/'
  };

  const stockLinks: Record<string, string> = {
    NVDA: 'https://www.tradingview.com/symbols/NASDAQ-NVDA/',
    AMD: 'https://www.tradingview.com/symbols/NASDAQ-AMD/',
    AMZN: 'https://www.tradingview.com/symbols/NASDAQ-AMZN/',
    MSFT: 'https://www.tradingview.com/symbols/NASDAQ-MSFT/',
    TSLA: 'https://www.tradingview.com/symbols/NASDAQ-TSLA/'
  };

  const buildSparklinePoints = (history: number[]) => {
    if (!history || history.length < 2) {
      return '';
    }

    const width = 120;
    const height = 32;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    return history
      .map((value, index) => {
        const x = (index / (history.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  useEffect(() => {
    const vanta = (window as any).VANTA;

    if (vanta && vantaRef.current && !vantaEffect.current) {
      vantaEffect.current = vanta.NET({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x8411d1,
        backgroundColor: 0x0,
        points: 17.0,
        maxDistance: 10.0,
        spacing: 20.0
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
    const configuredApiKey = process.env.REACT_APP_NASA_API_KEY?.trim();
    const apiKey = configuredApiKey || 'DEMO_KEY';
    const usingDemoKey = !configuredApiKey;
    const apodHome = 'https://apod.nasa.gov/apod/';
    const getApodPageUrl = (dateValue: unknown) => {
      if (typeof dateValue !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return apodHome;
      }

      const [year, month, day] = dateValue.split('-');
      return `${apodHome}ap${year.slice(2)}${month}${day}.html`;
    };

    const resolveUrl = (rawUrl: string, base: string) => {
      if (!rawUrl) {
        return '';
      }

      try {
        return new URL(rawUrl, base).toString();
      } catch {
        return '';
      }
    };

    const fetchTextWithCorsFallback = async (url: string) => {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

      try {
        const direct = await fetch(url);
        if (direct.ok) {
          return await direct.text();
        }
      } catch {
        // Fall through to proxy attempt.
      }

      const proxied = await fetch(proxyUrl);
      if (!proxied.ok) {
        throw new Error('Text fetch failed');
      }

      return await proxied.text();
    };

    const fetchRssWithFallback = async () => {
      const rssUrl = 'https://apod.nasa.gov/apod.rss';

      const parseRss = async (xmlText: string) => {
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
        const item = xmlDoc.querySelector('channel > item');
        const title = item?.querySelector('title')?.textContent?.trim() || 'Astronomy Picture of the Day';
        const linkRaw = item?.querySelector('link')?.textContent?.trim() || apodHome;
        const link = resolveUrl(linkRaw, apodHome) || apodHome;
        const desc = item?.querySelector('description')?.textContent || '';
        const htmlDoc = new DOMParser().parseFromString(desc, 'text/html');
        const rssImgRaw = htmlDoc.querySelector('img')?.getAttribute('src') || '';
        let bestImage = resolveUrl(rssImgRaw, link || apodHome);

        // RSS often points to a small preview image. Pull the image link from the APOD page when possible.
        if (link && link !== apodHome) {
          try {
            const pageHtml = await fetchTextWithCorsFallback(link);
            const pageDoc = new DOMParser().parseFromString(pageHtml, 'text/html');
            const pageImageRaw =
              pageDoc.querySelector('a[href^="image/"]')?.getAttribute('href') ||
              pageDoc.querySelector('a[href*="/image/"]')?.getAttribute('href') ||
              '';
            const pageImage = resolveUrl(pageImageRaw, link);

            if (pageImage) {
              bestImage = pageImage;
            }
          } catch {
            // Keep RSS image fallback.
          }
        }

        setApodTitle(title);
        setApodPageUrl(link);
        setApodImageUrl(bestImage);
      };

      const xmlText = await fetchTextWithCorsFallback(rssUrl);
      await parseRss(xmlText);
    };

    const fetchApod = async () => {
      try {
        const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&thumbs=true`);

        if (!response.ok) {
          if (!usingDemoKey && (response.status === 400 || response.status === 403)) {
            setApodTitle('Invalid NASA API key - update REACT_APP_NASA_API_KEY');
            setApodImageUrl('');
            setApodPageUrl('https://api.nasa.gov/');
            return;
          }

          if (usingDemoKey && response.status === 429) {
            setApodTitle('NASA API limit hit - set REACT_APP_NASA_API_KEY');
            setApodImageUrl('');
            setApodPageUrl('https://api.nasa.gov/');
            return;
          }

          await fetchRssWithFallback();
          return;
        }

        const data = await response.json();
        const title = typeof data?.title === 'string' ? data.title : 'Astronomy Picture of the Day';
        const mediaType = data?.media_type;
        const imageUrl = typeof data?.hdurl === 'string' ? data.hdurl : data?.url;
        const pageUrl = getApodPageUrl(data?.date);

        setApodPageUrl(pageUrl);

        if (mediaType === 'image' && typeof imageUrl === 'string') {
          setApodTitle(title);
          setApodImageUrl(imageUrl);
        } else {
          setApodTitle(`${title} (video today)`);
          setApodImageUrl('');
        }
      } catch {
        try {
          await fetchRssWithFallback();
        } catch {
          setApodTitle('Unavailable');
          setApodImageUrl('');
          setApodPageUrl(apodHome);
        }
      }
    };

    fetchApod();
  }, []);

  useEffect(() => {
    const fetchChuckJoke = async () => {
      try {
        const response = await fetch('https://api.chucknorris.io/jokes/random');
        if (!response.ok) {
          setChuckJoke('Unavailable');
          return;
        }

        const data = await response.json();
        const joke = typeof data?.value === 'string' ? data.value : 'No joke available today';
        setChuckJoke(joke);
      } catch {
        setChuckJoke('Unavailable');
      }
    };

    fetchChuckJoke();
  }, []);

  useEffect(() => {
    const getDayOfYear = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      return Math.floor(diff / 86400000);
    };

    const fetchDailyPokemon = async () => {
      try {
        const maxPokemonId = 1025;
        const day = getDayOfYear();
        const pokemonId = (day % maxPokemonId) + 1;

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (!response.ok) {
          setPokemonName('Unavailable');
          setPokemonImage('');
          setPokemonNumber(null);
          return;
        }

        const data = await response.json();
        const name = typeof data?.name === 'string' ? data.name : 'Unknown';
        const artwork = data?.sprites?.other?.['official-artwork']?.front_default;
        const sprite = data?.sprites?.front_default;

        setPokemonName(name.charAt(0).toUpperCase() + name.slice(1));
        setPokemonImage(artwork || sprite || '');
        setPokemonNumber(typeof data?.id === 'number' ? data.id : pokemonId);
      } catch {
        setPokemonName('Unavailable');
        setPokemonImage('');
        setPokemonNumber(null);
      }
    };

    fetchDailyPokemon();
  }, []);

  useEffect(() => {
    const usdFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    });

    const fetchCryptoPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,ripple,litecoin&price_change_percentage=24h&sparkline=true'
        );

        if (!response.ok) {
          setCryptoPrices({
            BTC: { price: 'Unavailable', changePct: null, history: [] },
            ETH: { price: 'Unavailable', changePct: null, history: [] },
            SOL: { price: 'Unavailable', changePct: null, history: [] },
            XRP: { price: 'Unavailable', changePct: null, history: [] },
            LTC: { price: 'Unavailable', changePct: null, history: [] }
          });
          return;
        }

        const data = await response.json();
        const byId = Array.isArray(data)
          ? Object.fromEntries(data.map((item: any) => [item.id, item]))
          : {};

        setCryptoPrices({
          BTC: {
            price: typeof byId?.bitcoin?.current_price === 'number' ? usdFormatter.format(byId.bitcoin.current_price) : 'N/A',
            changePct: typeof byId?.bitcoin?.price_change_percentage_24h === 'number' ? byId.bitcoin.price_change_percentage_24h : null,
            history: Array.isArray(byId?.bitcoin?.sparkline_in_7d?.price)
              ? byId.bitcoin.sparkline_in_7d.price.filter((v: any) => typeof v === 'number').slice(-24)
              : []
          },
          ETH: {
            price: typeof byId?.ethereum?.current_price === 'number' ? usdFormatter.format(byId.ethereum.current_price) : 'N/A',
            changePct: typeof byId?.ethereum?.price_change_percentage_24h === 'number' ? byId.ethereum.price_change_percentage_24h : null,
            history: Array.isArray(byId?.ethereum?.sparkline_in_7d?.price)
              ? byId.ethereum.sparkline_in_7d.price.filter((v: any) => typeof v === 'number').slice(-24)
              : []
          },
          SOL: {
            price: typeof byId?.solana?.current_price === 'number' ? usdFormatter.format(byId.solana.current_price) : 'N/A',
            changePct: typeof byId?.solana?.price_change_percentage_24h === 'number' ? byId.solana.price_change_percentage_24h : null,
            history: Array.isArray(byId?.solana?.sparkline_in_7d?.price)
              ? byId.solana.sparkline_in_7d.price.filter((v: any) => typeof v === 'number').slice(-24)
              : []
          },
          XRP: {
            price: typeof byId?.ripple?.current_price === 'number' ? usdFormatter.format(byId.ripple.current_price) : 'N/A',
            changePct: typeof byId?.ripple?.price_change_percentage_24h === 'number' ? byId.ripple.price_change_percentage_24h : null,
            history: Array.isArray(byId?.ripple?.sparkline_in_7d?.price)
              ? byId.ripple.sparkline_in_7d.price.filter((v: any) => typeof v === 'number').slice(-24)
              : []
          },
          LTC: {
            price: typeof byId?.litecoin?.current_price === 'number' ? usdFormatter.format(byId.litecoin.current_price) : 'N/A',
            changePct: typeof byId?.litecoin?.price_change_percentage_24h === 'number' ? byId.litecoin.price_change_percentage_24h : null,
            history: Array.isArray(byId?.litecoin?.sparkline_in_7d?.price)
              ? byId.litecoin.sparkline_in_7d.price.filter((v: any) => typeof v === 'number').slice(-24)
              : []
          }
        });
      } catch {
        setCryptoPrices({
          BTC: { price: 'Unavailable', changePct: null, history: [] },
          ETH: { price: 'Unavailable', changePct: null, history: [] },
          SOL: { price: 'Unavailable', changePct: null, history: [] },
          XRP: { price: 'Unavailable', changePct: null, history: [] },
          LTC: { price: 'Unavailable', changePct: null, history: [] }
        });
      }
    };

    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWithFallback = async (url: string) => {
      try {
        const direct = await fetch(url);
        if (direct.ok) {
          return direct;
        }
      } catch {
        // Fall through to proxy.
      }

      return fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    };

    const parsePriceFromCsv = (csvText: string) => {
      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        return null;
      }

      const row = lines[1].split(',');
      const openValue = row[3];
      const closeValue = row[6];
      const open = Number(openValue);
      const price = Number(closeValue);

      if (!Number.isFinite(price)) {
        return null;
      }

      const changePct = Number.isFinite(open) && open !== 0 ? ((price - open) / open) * 100 : null;
      const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
      }).format(price);

      return { price: formattedPrice, changePct, history: [] as number[] };
    };

    const parseHistoryFromCsv = (csvText: string) => {
      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        return [];
      }

      const rows = lines.slice(1).map((line) => line.split(','));
      return rows
        .map((row) => Number(row[4]))
        .filter((value) => Number.isFinite(value))
        .slice(-20);
    };

    const fetchStockPrices = async () => {
      const symbols = ['NVDA.US', 'AMD.US', 'AMZN.US', 'MSFT.US', 'TSLA.US'];

      const results = await Promise.all(
        symbols.map(async (symbol) => {
          const ticker = symbol.replace('.US', '');
          const latestUrl = `https://stooq.com/q/l/?s=${symbol.toLowerCase()}&f=sd2t2ohlcv&h&e=csv`;
          const historyUrl = `https://stooq.com/q/d/l/?s=${symbol.toLowerCase()}&i=d`;

          try {
            const [latestResponse, historyResponse] = await Promise.all([
              fetchWithFallback(latestUrl),
              fetchWithFallback(historyUrl)
            ]);

            if (!latestResponse.ok) {
              return [ticker, { price: 'Unavailable', changePct: null, history: [] }] as const;
            }

            const latestCsv = await latestResponse.text();
            const parsed = parsePriceFromCsv(latestCsv) || { price: 'N/A', changePct: null, history: [] };

            if (historyResponse.ok) {
              const historyCsv = await historyResponse.text();
              parsed.history = parseHistoryFromCsv(historyCsv);
            }

            return [ticker, parsed] as const;
          } catch {
            return [ticker, { price: 'Unavailable', changePct: null, history: [] }] as const;
          }
        })
      );

      setStockPrices(Object.fromEntries(results));
    };

    fetchStockPrices();
    const interval = setInterval(fetchStockPrices, 120000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="fun-page" aria-live="polite" ref={vantaRef}>
      <div className="fun-page-content">
        <h1>Fun Stuff</h1>
        <div className="purple-divider"></div>

        <div className="market-row">
          <div className="rapid-rating rapid-rating-fun market-card">
            <i className="fas fa-coins rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Crypto Prices</p>
            <div className="market-list">
              {['BTC', 'ETH', 'SOL', 'XRP', 'LTC'].map((symbol) => {
                const quote = cryptoPrices[symbol];
                const change = quote?.changePct;
                const directionClass = typeof change === 'number' ? (change >= 0 ? 'up' : 'down') : 'neutral';
                const points = buildSparklinePoints(quote?.history || []);

                return (
                  <div key={symbol} className="market-item">
                    <a
                      href={cryptoLinks[symbol]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="market-link"
                      aria-label={`${symbol} chart`}
                    >
                      <div className="market-inline-row">
                        <span className="market-label">{symbol}</span>
                        <div className="market-sparkline">
                          {points ? (
                            <svg viewBox="0 0 120 32" className="sparkline-svg" aria-hidden="true">
                              <polyline points={points} className={`sparkline-line ${directionClass}`} />
                            </svg>
                          ) : (
                            <span className="sparkline-empty"></span>
                          )}
                        </div>
                        <span className={`market-price ${directionClass}`}>{quote?.price || 'N/A'}</span>
                        <span className={`market-change ${directionClass}`}>
                          {typeof change === 'number' ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rapid-rating rapid-rating-fun market-card">
            <i className="fas fa-chart-line rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Stocks</p>
            <div className="market-list">
              {[
                { label: 'NVIDIA (NVDA)', key: 'NVDA' },
                { label: 'AMD', key: 'AMD' },
                { label: 'Amazon (AMZN)', key: 'AMZN' },
                { label: 'Microsoft (MSFT)', key: 'MSFT' },
                { label: 'Tesla (TSLA)', key: 'TSLA' }
              ].map((stock) => {
                const quote = stockPrices[stock.key];
                const change = quote?.changePct;
                const directionClass = typeof change === 'number' ? (change >= 0 ? 'up' : 'down') : 'neutral';
                const points = buildSparklinePoints(quote?.history || []);

                return (
                  <div key={stock.key} className="market-item">
                    <a
                      href={stockLinks[stock.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="market-link"
                      aria-label={`${stock.key} chart`}
                    >
                      <div className="market-inline-row">
                        <span className="market-label">{stock.label}</span>
                        <div className="market-sparkline">
                          {points ? (
                            <svg viewBox="0 0 120 32" className="sparkline-svg" aria-hidden="true">
                              <polyline points={points} className={`sparkline-line ${directionClass}`} />
                            </svg>
                          ) : (
                            <span className="sparkline-empty"></span>
                          )}
                        </div>
                        <span className={`market-price ${directionClass}`}>{quote?.price || 'N/A'}</span>
                        <span className={`market-change ${directionClass}`}>
                          {typeof change === 'number' ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rapid-rating rapid-rating-fun">
            <i className="fas fa-dragon rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Daily Pokemon</p>
            {pokemonImage ? (
              <img src={pokemonImage} alt={pokemonName} className="pokemon-image" loading="lazy" />
            ) : (
              <p className="fun-joke-text">No image available</p>
            )}
            <p className="apod-title">
              {pokemonNumber ? `#${pokemonNumber} ` : ''}
              {pokemonName}
            </p>
          </div>

          <div className="rapid-rating rapid-rating-apod rapid-rating-fun">
            <i className="fas fa-star rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Astronomy Picture</p>
            {apodImageUrl ? (
              <a href={apodPageUrl} target="_blank" rel="noopener noreferrer" className="apod-link">
                <img src={apodImageUrl} alt={apodTitle} className="apod-image" loading="lazy" />
                <span className="apod-full-preview" aria-hidden="true">
                  <img src={apodImageUrl} alt="" className="apod-full-image" loading="lazy" />
                </span>
              </a>
            ) : (
              <a href={apodPageUrl} target="_blank" rel="noopener noreferrer" className="rapid-rating-value">
                Open APOD
              </a>
            )}
            <p className="apod-title">{apodTitle}</p>
          </div>
        </div>

        <div className="purple-divider"></div>

        <div className="fun-widgets">
          <div className="rapid-rating rapid-rating-fun">
            <i className="fas fa-face-grin-squint rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Chuck Norris Joke</p>
            <p className="fun-joke-text">{chuckJoke}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FunStuff;
