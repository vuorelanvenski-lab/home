/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from 'react';

type MarketQuote = {
  price: string;
  changePct: number | null;
  history: number[];
};

type DataStatus = 'loading' | 'live' | 'fallback' | 'rate-limited' | 'error';
type RangeOption = '1D' | '7D' | '30D';

const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const proxyOptions = ['https://corsproxy.io/?', 'https://api.allorigins.win/raw?url='];

const CRYPTO_SYMBOLS = [
  'BTC',
  'ETH',
  'SOL',
  'XRP',
  'LTC',
  'BNB',
  'DOGE',
  'ADA',
  'TRX',
  'AVAX',
  'DOT',
  'LINK',
  'BCH',
  'UNI',
  'XLM',
  'APT',
  'NEAR',
  'ICP',
  'ETC',
  'FIL',
  'MATIC'
] as const;
const STOCK_ITEMS = [
  { key: 'NVDA', label: '$ NVDA' },
  { key: 'AMD', label: '$ AMD' },
  { key: 'AMZN', label: '$ AMZN' },
  { key: 'MSFT', label: '$ MSFT' },
  { key: 'TSLA', label: '$ TSLA' },
  { key: 'AAPL', label: '$ AAPL' },
  { key: 'META', label: '$ META' },
  { key: 'GOOGL', label: '$ GOOGL' },
  { key: 'NFLX', label: '$ NFLX' },
  { key: 'AVGO', label: '$ AVGO' },
  { key: 'INTC', label: '$ INTC' },
  { key: 'QCOM', label: '$ QCOM' },
  { key: 'ORCL', label: '$ ORCL' },
  { key: 'CSCO', label: '$ CSCO' },
  { key: 'ADBE', label: '$ ADBE' },
  { key: 'PYPL', label: '$ PYPL' },
  { key: 'COIN', label: '$ COIN' },
  { key: 'PLTR', label: '$ PLTR' },
  { key: 'AMAT', label: '$ AMAT' },
  { key: 'TXN', label: '$ TXN' },
  { key: 'PANW', label: '$ PANW' },
  { key: 'ASML', label: '$ ASML' },
  { key: 'UBER', label: '$ UBER' },
  { key: 'CRM', label: '$ CRM' },
  { key: 'SHOP', label: '$ SHOP' }
] as const;

const makeEmptyQuote = (): MarketQuote => ({ price: 'Loading...', changePct: null, history: [] });
const makeUnavailableQuote = (): MarketQuote => ({ price: 'Unavailable', changePct: null, history: [] });
const buildQuoteRecord = (symbols: readonly string[], builder: () => MarketQuote): Record<string, MarketQuote> =>
  Object.fromEntries(symbols.map((symbol) => [symbol, builder()])) as Record<string, MarketQuote>;

function FunStuff() {
  const vantaRef = useRef<HTMLElement | null>(null);
  const vantaEffect = useRef<any>(null);

  const [apodTitle, setApodTitle] = useState<string>('Loading...');
  const [apodImageUrl, setApodImageUrl] = useState<string>('');
  const [apodPageUrl, setApodPageUrl] = useState<string>('https://apod.nasa.gov/apod/');
  const [apodModalOpen, setApodModalOpen] = useState(false);

  const [pokemonName, setPokemonName] = useState<string>('Loading...');
  const [pokemonImage, setPokemonImage] = useState<string>('');
  const [pokemonNumber, setPokemonNumber] = useState<number | null>(null);

  const [cryptoPrices, setCryptoPrices] = useState<Record<string, MarketQuote>>(buildQuoteRecord(CRYPTO_SYMBOLS, makeEmptyQuote));

  const [stockPrices, setStockPrices] = useState<Record<string, MarketQuote>>(
    buildQuoteRecord(
      STOCK_ITEMS.map((item) => item.key),
      makeEmptyQuote
    )
  );

  const [cryptoStatus, setCryptoStatus] = useState<DataStatus>('loading');
  const [stockStatus, setStockStatus] = useState<DataStatus>('loading');
  const [apodStatus, setApodStatus] = useState<DataStatus>('loading');
  const [pokemonStatus, setPokemonStatus] = useState<DataStatus>('loading');

  const [cryptoUpdatedAt, setCryptoUpdatedAt] = useState<Date | null>(null);
  const [stockUpdatedAt, setStockUpdatedAt] = useState<Date | null>(null);
  const [apodUpdatedAt, setApodUpdatedAt] = useState<Date | null>(null);
  const [pokemonUpdatedAt, setPokemonUpdatedAt] = useState<Date | null>(null);

  const [cryptoRange, setCryptoRange] = useState<RangeOption>('7D');
  const [stockRange, setStockRange] = useState<RangeOption>('7D');

  const [cryptoFilter, setCryptoFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const [favoriteCrypto, setFavoriteCrypto] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('favoriteCrypto');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [favoriteStocks, setFavoriteStocks] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('favoriteStocks');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const configuredApiKey = process.env.REACT_APP_NASA_API_KEY?.trim();
  const nasaApiKey = configuredApiKey || 'DEMO_KEY';
  const usingDemoKey = !configuredApiKey;
  const apodHome = 'https://apod.nasa.gov/apod/';

  const cryptoLinks: Record<string, string> = {
    BTC: 'https://www.tradingview.com/symbols/BTCUSD/',
    ETH: 'https://www.tradingview.com/symbols/ETHUSD/',
    SOL: 'https://www.tradingview.com/symbols/SOLUSD/',
    XRP: 'https://www.tradingview.com/symbols/XRPUSD/',
    LTC: 'https://www.tradingview.com/symbols/LTCUSD/',
    BNB: 'https://www.tradingview.com/symbols/BNBUSD/',
    DOGE: 'https://www.tradingview.com/symbols/DOGEUSD/',
    ADA: 'https://www.tradingview.com/symbols/ADAUSD/',
    TRX: 'https://www.tradingview.com/symbols/TRXUSD/',
    AVAX: 'https://www.tradingview.com/symbols/AVAXUSD/',
    DOT: 'https://www.tradingview.com/symbols/DOTUSD/',
    LINK: 'https://www.tradingview.com/symbols/LINKUSD/',
    BCH: 'https://www.tradingview.com/symbols/BCHUSD/',
    UNI: 'https://www.tradingview.com/symbols/UNIUSD/',
    XLM: 'https://www.tradingview.com/symbols/XLMUSD/',
    APT: 'https://www.tradingview.com/symbols/APTUSD/',
    NEAR: 'https://www.tradingview.com/symbols/NEARUSD/',
    ICP: 'https://www.tradingview.com/symbols/ICPUSD/',
    ETC: 'https://www.tradingview.com/symbols/ETCUSD/',
    FIL: 'https://www.tradingview.com/symbols/FILUSD/',
    MATIC: 'https://www.tradingview.com/symbols/MATICUSD/'
  };

  const cryptoIdBySymbol: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    XRP: 'ripple',
    LTC: 'litecoin',
    BNB: 'binancecoin',
    DOGE: 'dogecoin',
    ADA: 'cardano',
    TRX: 'tron',
    AVAX: 'avalanche-2',
    DOT: 'polkadot',
    LINK: 'chainlink',
    BCH: 'bitcoin-cash',
    UNI: 'uniswap',
    XLM: 'stellar',
    APT: 'aptos',
    NEAR: 'near',
    ICP: 'internet-computer',
    ETC: 'ethereum-classic',
    FIL: 'filecoin',
    MATIC: 'matic-network'
  };

  const cryptoIcons: Record<string, string> = {
    BTC: 'https://cdn.simpleicons.org/bitcoin/F7931A',
    ETH: 'https://cdn.simpleicons.org/ethereum/8C8C8C',
    SOL: 'https://cdn.simpleicons.org/solana/14F195',
    XRP: 'https://cdn.simpleicons.org/ripple/27A2DB',
    LTC: 'https://cdn.simpleicons.org/litecoin/BEBEBE',
    BNB: 'https://cdn.simpleicons.org/binance/F3BA2F',
    DOGE: 'https://cdn.simpleicons.org/dogecoin/C2A633',
    ADA: 'https://cdn.simpleicons.org/cardano/0033AD',
    TRX: 'https://cdn.simpleicons.org/tron/FF060A',
    AVAX: 'https://cdn.simpleicons.org/avalanche/FF6B6B',
    DOT: 'https://cdn.simpleicons.org/polkadot/E6007A',
    LINK: 'https://cdn.simpleicons.org/chainlink/2A5ADA',
    BCH: 'https://cdn.simpleicons.org/bitcoincash/8DC351',
    UNI: 'https://cdn.simpleicons.org/uniswap/FF007A',
    XLM: 'https://cdn.simpleicons.org/stellar/7D00FF',
    APT: 'https://cdn.simpleicons.org/aptos/FFFFFF',
    NEAR: 'https://cdn.simpleicons.org/near/FFFFFF',
    ICP: 'https://cdn.simpleicons.org/internetcomputer/29ABE2',
    ETC: 'https://cdn.simpleicons.org/ethereumclassic/3AB83A',
    FIL: 'https://cdn.simpleicons.org/filecoin/0090FF',
    MATIC: 'https://cdn.simpleicons.org/polygon/8247E5'
  };

  const stockLinks: Record<string, string> = {
    NVDA: 'https://www.tradingview.com/symbols/NASDAQ-NVDA/',
    AMD: 'https://www.tradingview.com/symbols/NASDAQ-AMD/',
    AMZN: 'https://www.tradingview.com/symbols/NASDAQ-AMZN/',
    MSFT: 'https://www.tradingview.com/symbols/NASDAQ-MSFT/',
    TSLA: 'https://www.tradingview.com/symbols/NASDAQ-TSLA/',
    AAPL: 'https://www.tradingview.com/symbols/NASDAQ-AAPL/',
    META: 'https://www.tradingview.com/symbols/NASDAQ-META/',
    GOOGL: 'https://www.tradingview.com/symbols/NASDAQ-GOOGL/',
    NFLX: 'https://www.tradingview.com/symbols/NASDAQ-NFLX/',
    AVGO: 'https://www.tradingview.com/symbols/NASDAQ-AVGO/',
    INTC: 'https://www.tradingview.com/symbols/NASDAQ-INTC/',
    QCOM: 'https://www.tradingview.com/symbols/NASDAQ-QCOM/',
    ORCL: 'https://www.tradingview.com/symbols/NYSE-ORCL/',
    CSCO: 'https://www.tradingview.com/symbols/NASDAQ-CSCO/',
    ADBE: 'https://www.tradingview.com/symbols/NASDAQ-ADBE/',
    PYPL: 'https://www.tradingview.com/symbols/NASDAQ-PYPL/',
    COIN: 'https://www.tradingview.com/symbols/NASDAQ-COIN/',
    PLTR: 'https://www.tradingview.com/symbols/NASDAQ-PLTR/',
    AMAT: 'https://www.tradingview.com/symbols/NASDAQ-AMAT/',
    TXN: 'https://www.tradingview.com/symbols/NASDAQ-TXN/',
    PANW: 'https://www.tradingview.com/symbols/NASDAQ-PANW/',
    ASML: 'https://www.tradingview.com/symbols/NASDAQ-ASML/',
    UBER: 'https://www.tradingview.com/symbols/NYSE-UBER/',
    CRM: 'https://www.tradingview.com/symbols/NYSE-CRM/',
    SHOP: 'https://www.tradingview.com/symbols/NYSE-SHOP/'
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchWithTimeout = async (url: string, timeoutMs: number = TIMEOUT_MS, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchWithFallback = async (
    url: string,
    options?: { useProxy?: boolean; retries?: number; timeoutMs?: number; init?: RequestInit }
  ): Promise<Response> => {
    const { useProxy = false, retries = MAX_RETRIES, timeoutMs = TIMEOUT_MS, init } = options || {};
    const targets = useProxy ? [url, ...proxyOptions.map((proxy) => `${proxy}${encodeURIComponent(url)}`)] : [url];
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      for (const target of targets) {
        try {
          const response = await fetchWithTimeout(target, timeoutMs, init);
          if (response.ok) {
            return response;
          }
          lastError = `${response.status} ${response.statusText}`;
        } catch (err) {
          lastError = err;
        }
      }

      if (attempt < retries) {
        await wait(400 * (attempt + 1));
      }
    }

    throw new Error(`Failed to fetch ${url}: ${String(lastError)}`);
  };

  const usdFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
      }),
    []
  );

  const statusLabel = (status: DataStatus) => {
    switch (status) {
      case 'live':
        return 'Live';
      case 'fallback':
        return 'Fallback';
      case 'rate-limited':
        return 'Rate limited';
      case 'error':
        return 'Error';
      default:
        return 'Loading';
    }
  };

  const formatUpdatedTime = (value: Date | null) => {
    if (!value) {
      return 'Updated: --';
    }

    return `Updated: ${value.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })}`;
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

  const sliceHistoryByRange = (history: number[], range: RangeOption, marketType: 'crypto' | 'stock') => {
    if (!Array.isArray(history) || history.length < 2) {
      return history;
    }

    if (marketType === 'crypto') {
      if (range === '1D') {
        return history.slice(-24);
      }

      if (range === '7D') {
        return history.slice(-168);
      }

      return history.slice(-720);
    }

    if (range === '1D') {
      return history.slice(-5);
    }

    if (range === '7D') {
      return history.slice(-7);
    }

    return history.slice(-30);
  };

  const calculateRangeChangePct = (history: number[]): number | null => {
    if (!Array.isArray(history) || history.length < 2) {
      return null;
    }

    const startValue = history[0];
    const endValue = history[history.length - 1];

    if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || startValue === 0) {
      return null;
    }

    return ((endValue - startValue) / startValue) * 100;
  };

  const savePinned = (key: 'favoriteCrypto' | 'favoriteStocks', values: string[]) => {
    localStorage.setItem(key, JSON.stringify(values));
  };

  const togglePinnedCrypto = (symbol: string) => {
    setFavoriteCrypto((prev) => {
      const next = prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [...prev, symbol];
      savePinned('favoriteCrypto', next);
      return next;
    });
  };

  const togglePinnedStock = (symbol: string) => {
    setFavoriteStocks((prev) => {
      const next = prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [...prev, symbol];
      savePinned('favoriteStocks', next);
      return next;
    });
  };

  const sortWithPinned = (symbols: string[], pinned: string[]) => {
    return [...symbols].sort((a, b) => {
      const aPinned = pinned.includes(a) ? 1 : 0;
      const bPinned = pinned.includes(b) ? 1 : 0;

      if (aPinned !== bPinned) {
        return bPinned - aPinned;
      }

      return a.localeCompare(b);
    });
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

  const getApodPageUrl = (dateValue: unknown) => {
    if (typeof dateValue !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return apodHome;
    }

    const [year, month, day] = dateValue.split('-');
    return `${apodHome}ap${year.slice(2)}${month}${day}.html`;
  };

  const fetchTextWithCorsFallback = async (url: string) => {
    const response = await fetchWithFallback(url, { useProxy: true });
    return await response.text();
  };

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

  const fetchApod = async () => {
    setApodStatus('loading');

    const fetchRssWithFallback = async () => {
      const rssUrl = 'https://apod.nasa.gov/apod.rss';
      const xmlText = await fetchTextWithCorsFallback(rssUrl);
      const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
      const item = xmlDoc.querySelector('channel > item');
      const title = item?.querySelector('title')?.textContent?.trim() || 'Astronomy Picture of the Day';
      const linkRaw = item?.querySelector('link')?.textContent?.trim() || apodHome;
      const link = resolveUrl(linkRaw, apodHome) || apodHome;
      const desc = item?.querySelector('description')?.textContent || '';
      const htmlDoc = new DOMParser().parseFromString(desc, 'text/html');
      const rssImgRaw = htmlDoc.querySelector('img')?.getAttribute('src') || '';
      let bestImage = resolveUrl(rssImgRaw, link || apodHome);

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
      setApodStatus('fallback');
      setApodUpdatedAt(new Date());
    };

    try {
      const response = await fetchWithFallback(`https://api.nasa.gov/planetary/apod?api_key=${nasaApiKey}&thumbs=true`);

      if (!response.ok) {
        if (!usingDemoKey && (response.status === 400 || response.status === 403)) {
          setApodTitle('Invalid NASA API key - update REACT_APP_NASA_API_KEY');
          setApodImageUrl('');
          setApodPageUrl('https://api.nasa.gov/');
          setApodStatus('error');
          setApodUpdatedAt(new Date());
          return;
        }

        if (usingDemoKey && response.status === 429) {
          setApodTitle('NASA API limit hit - set REACT_APP_NASA_API_KEY');
          setApodImageUrl('');
          setApodPageUrl('https://api.nasa.gov/');
          setApodStatus('rate-limited');
          setApodUpdatedAt(new Date());
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

      setApodStatus('live');
      setApodUpdatedAt(new Date());
    } catch {
      try {
        await fetchRssWithFallback();
      } catch {
        setApodTitle('Unavailable');
        setApodImageUrl('');
        setApodPageUrl(apodHome);
        setApodStatus('error');
        setApodUpdatedAt(new Date());
      }
    }
  };



  const fetchDailyPokemon = async () => {
    setPokemonStatus('loading');

    const getDayOfYear = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      return Math.floor(diff / 86400000);
    };

    try {
      const maxPokemonId = 1025;
      const day = getDayOfYear();
      const pokemonId = (day % maxPokemonId) + 1;

      const response = await fetchWithFallback(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      if (!response.ok) {
        setPokemonName('Unavailable');
        setPokemonImage('');
        setPokemonNumber(null);
        setPokemonStatus('error');
        setPokemonUpdatedAt(new Date());
        return;
      }

      const data = await response.json();
      const name = typeof data?.name === 'string' ? data.name : 'Unknown';
      const artwork = data?.sprites?.other?.['official-artwork']?.front_default;
      const sprite = data?.sprites?.front_default;

      setPokemonName(name.charAt(0).toUpperCase() + name.slice(1));
      setPokemonImage(artwork || sprite || '');
      setPokemonNumber(typeof data?.id === 'number' ? data.id : pokemonId);
      setPokemonStatus('live');
      setPokemonUpdatedAt(new Date());
    } catch {
      setPokemonName('Unavailable');
      setPokemonImage('');
      setPokemonNumber(null);
      setPokemonStatus('error');
      setPokemonUpdatedAt(new Date());
    }
  };

  const fetchCryptoPrices = async () => {
    setCryptoStatus('loading');

    try {
      const cryptoIds = CRYPTO_SYMBOLS.map((symbol) => cryptoIdBySymbol[symbol]).join(',');
      const response = await fetchWithFallback(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cryptoIds}&price_change_percentage=24h&sparkline=true`
      );

      if (!response.ok) {
        setCryptoPrices(buildQuoteRecord(CRYPTO_SYMBOLS, makeUnavailableQuote));
        setCryptoStatus('error');
        setCryptoUpdatedAt(new Date());
        return;
      }

      const data = await response.json();
      const byId = Array.isArray(data) ? Object.fromEntries(data.map((item: any) => [item.id, item])) : {};

      setCryptoPrices(
        Object.fromEntries(
          CRYPTO_SYMBOLS.map((symbol) => {
            const coinId = cryptoIdBySymbol[symbol];
            const coin = byId?.[coinId];

            return [
              symbol,
              {
                price: typeof coin?.current_price === 'number' ? usdFormatter.format(coin.current_price) : 'N/A',
                changePct: typeof coin?.price_change_percentage_24h === 'number' ? coin.price_change_percentage_24h : null,
                history: Array.isArray(coin?.sparkline_in_7d?.price)
                  ? coin.sparkline_in_7d.price.filter((v: any) => typeof v === 'number')
                  : []
              } as MarketQuote
            ];
          })
        ) as Record<string, MarketQuote>
      );

      setCryptoStatus('live');
      setCryptoUpdatedAt(new Date());
    } catch {
      setCryptoPrices(buildQuoteRecord(CRYPTO_SYMBOLS, makeUnavailableQuote));
      setCryptoStatus('error');
      setCryptoUpdatedAt(new Date());
    }
  };

  const fetchStockPrices = async () => {
    setStockStatus('loading');

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
      const formattedPrice = usdFormatter.format(price);

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
        .slice(-40);
    };

    try {
      const symbols = STOCK_ITEMS.map((stock) => `${stock.key}.US`);

      const results = await Promise.all(
        symbols.map(async (symbol) => {
          const ticker = symbol.replace('.US', '');
          const latestUrl = `https://stooq.com/q/l/?s=${symbol.toLowerCase()}&f=sd2t2ohlcv&h&e=csv`;
          const historyUrl = `https://stooq.com/q/d/l/?s=${symbol.toLowerCase()}&i=d`;

          try {
            const [latestResponse, historyResponse] = await Promise.all([
              fetchWithFallback(latestUrl, { useProxy: true }),
              fetchWithFallback(historyUrl, { useProxy: true })
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
      setStockStatus('live');
      setStockUpdatedAt(new Date());
    } catch {
      setStockPrices(buildQuoteRecord(STOCK_ITEMS.map((stock) => stock.key), makeUnavailableQuote));
      setStockStatus('error');
      setStockUpdatedAt(new Date());
    }
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
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setApodModalOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchApod();
    fetchDailyPokemon();
    fetchCryptoPrices();
    fetchStockPrices();

    const apodInterval = setInterval(fetchApod, 60 * 60 * 1000);
    const cryptoInterval = setInterval(fetchCryptoPrices, 60 * 1000);
    const stockInterval = setInterval(fetchStockPrices, 2 * 60 * 1000);

    return () => {
      clearInterval(apodInterval);
      clearInterval(cryptoInterval);
      clearInterval(stockInterval);
    };
  }, []);

  const visibleCrypto = useMemo(() => {
    const filter = cryptoFilter.trim().toUpperCase();
    const filtered = CRYPTO_SYMBOLS.filter((symbol) => !filter || symbol.includes(filter));
    return sortWithPinned([...filtered], favoriteCrypto);
  }, [cryptoFilter, favoriteCrypto]);

  const visibleStocks = useMemo(() => {
    const filter = stockFilter.trim().toUpperCase();
    const filtered = STOCK_ITEMS.filter((stock) => !filter || stock.key.includes(filter));
    const orderedKeys = sortWithPinned(
      filtered.map((stock) => stock.key),
      favoriteStocks
    );
    return orderedKeys
      .map((key) => STOCK_ITEMS.find((item) => item.key === key))
      .filter((item): item is (typeof STOCK_ITEMS)[number] => Boolean(item));
  }, [stockFilter, favoriteStocks]);

  return (
    <section className="fun-page" aria-live="polite" ref={vantaRef}>
      <div className="fun-page-content">
        <h1>Fun Stuff</h1>
        <div className="purple-divider"></div>

        <div className="market-row">
          <div className="rapid-rating rapid-rating-fun market-card fun-card" style={{ animationDelay: '0ms' }}>
            <i className="fa-brands fa-btc rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Crypto Prices</p>
            <div className="card-tools">
              <span className={`status-badge ${cryptoStatus}`}>{statusLabel(cryptoStatus)}</span>
              <button type="button" className="refresh-btn" onClick={fetchCryptoPrices} aria-label="Refresh crypto prices">
                <i className="fas fa-rotate-right" aria-hidden="true"></i>
                Refresh
              </button>
            </div>
            <p className="updated-time">{formatUpdatedTime(cryptoUpdatedAt)}</p>
            <div className="market-controls">
              <input
                type="text"
                value={cryptoFilter}
                onChange={(event) => setCryptoFilter(event.target.value)}
                className="market-search"
                placeholder="Filter symbols"
                aria-label="Filter cryptocurrencies"
              />
              <div className="range-toggle" role="group" aria-label="Crypto chart range">
                {(['1D', '7D', '30D'] as RangeOption[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`range-btn ${cryptoRange === range ? 'active' : ''}`}
                    onClick={() => setCryptoRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="market-list">
              {visibleCrypto.map((symbol) => {
                const quote = cryptoPrices[symbol];
                const filteredHistory = sliceHistoryByRange(quote?.history || [], cryptoRange, 'crypto');
                const rangeChange = calculateRangeChangePct(filteredHistory);
                const displayChange = rangeChange !== null ? rangeChange : quote?.changePct;
                const directionClass = typeof displayChange === 'number' ? (displayChange >= 0 ? 'up' : 'down') : 'neutral';
                const points = buildSparklinePoints(filteredHistory);
                const iconSrc = cryptoIcons[symbol];
                const isPinned = favoriteCrypto.includes(symbol);
                const isLoading = quote?.price === 'Loading...';

                return (
                  <div key={symbol} className="market-item">
                    <button
                      type="button"
                      className={`pin-btn ${isPinned ? 'active' : ''}`}
                      onClick={() => togglePinnedCrypto(symbol)}
                      aria-label={`${isPinned ? 'Unpin' : 'Pin'} ${symbol}`}
                    >
                      <i className={`fas ${isPinned ? 'fa-star' : 'fa-star-half-stroke'}`} aria-hidden="true"></i>
                    </button>
                    <a
                      href={cryptoLinks[symbol]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="market-link"
                      aria-label={`${symbol} chart`}
                    >
                      <div className="market-inline-row">
                        <span className="market-label">
                          <img src={iconSrc} alt="" aria-hidden="true" className="market-crypto-icon" loading="lazy" />
                          {symbol}
                        </span>
                        <div className="market-sparkline">
                          {points ? (
                            <svg viewBox="0 0 120 32" className="sparkline-svg" aria-hidden="true">
                              <polyline points={points} className={`sparkline-line ${directionClass}`} />
                            </svg>
                          ) : (
                            <span className="sparkline-empty"></span>
                          )}
                        </div>
                        {isLoading ? (
                          <span className="skeleton-line price"></span>
                        ) : (
                          <span className={`market-price ${directionClass}`}>{quote?.price || 'N/A'}</span>
                        )}
                        {isLoading ? (
                          <span className="skeleton-line change"></span>
                        ) : (
                          <span className={`market-change ${directionClass}`}>
                            {typeof displayChange === 'number' ? `${displayChange >= 0 ? '+' : ''}${displayChange.toFixed(2)}%` : 'N/A'}
                          </span>
                        )}
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rapid-rating rapid-rating-fun market-card fun-card" style={{ animationDelay: '90ms' }}>
            <i className="fas fa-chart-line rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Stocks</p>
            <div className="card-tools">
              <span className={`status-badge ${stockStatus}`}>{statusLabel(stockStatus)}</span>
              <button type="button" className="refresh-btn" onClick={fetchStockPrices} aria-label="Refresh stock prices">
                <i className="fas fa-rotate-right" aria-hidden="true"></i>
                Refresh
              </button>
            </div>
            <p className="updated-time">{formatUpdatedTime(stockUpdatedAt)}</p>
            <div className="market-controls">
              <input
                type="text"
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                className="market-search"
                placeholder="Filter symbols"
                aria-label="Filter stock symbols"
              />
              <div className="range-toggle" role="group" aria-label="Stock chart range">
                {(['1D', '7D', '30D'] as RangeOption[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`range-btn ${stockRange === range ? 'active' : ''}`}
                    onClick={() => setStockRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="market-list">
              {visibleStocks.map((stock) => {
                const quote = stockPrices[stock.key];
                const filteredHistory = sliceHistoryByRange(quote?.history || [], stockRange, 'stock');
                const rangeChange = calculateRangeChangePct(filteredHistory);
                const displayChange = rangeChange !== null ? rangeChange : quote?.changePct;
                const directionClass = typeof displayChange === 'number' ? (displayChange >= 0 ? 'up' : 'down') : 'neutral';
                const points = buildSparklinePoints(filteredHistory);
                const isPinned = favoriteStocks.includes(stock.key);
                const isLoading = quote?.price === 'Loading...';

                return (
                  <div key={stock.key} className="market-item">
                    <button
                      type="button"
                      className={`pin-btn ${isPinned ? 'active' : ''}`}
                      onClick={() => togglePinnedStock(stock.key)}
                      aria-label={`${isPinned ? 'Unpin' : 'Pin'} ${stock.key}`}
                    >
                      <i className={`fas ${isPinned ? 'fa-star' : 'fa-star-half-stroke'}`} aria-hidden="true"></i>
                    </button>
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
                        {isLoading ? (
                          <span className="skeleton-line price"></span>
                        ) : (
                          <span className={`market-price ${directionClass}`}>{quote?.price || 'N/A'}</span>
                        )}
                        {isLoading ? (
                          <span className="skeleton-line change"></span>
                        ) : (
                          <span className={`market-change ${directionClass}`}>
                            {typeof displayChange === 'number' ? `${displayChange >= 0 ? '+' : ''}${displayChange.toFixed(2)}%` : 'N/A'}
                          </span>
                        )}
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rapid-rating rapid-rating-fun fun-card" style={{ animationDelay: '180ms' }}>
            <i className="fas fa-dragon rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Daily Pokemon</p>
            <div className="card-tools">
              <span className={`status-badge ${pokemonStatus}`}>{statusLabel(pokemonStatus)}</span>
              <button type="button" className="refresh-btn" onClick={fetchDailyPokemon} aria-label="Refresh daily pokemon">
                <i className="fas fa-rotate-right" aria-hidden="true"></i>
                Refresh
              </button>
            </div>
            <p className="updated-time">{formatUpdatedTime(pokemonUpdatedAt)}</p>
            {pokemonStatus === 'loading' ? (
              <div className="skeleton-box pokemon"></div>
            ) : pokemonImage ? (
              <img src={pokemonImage} alt={pokemonName} className="pokemon-image" loading="lazy" />
            ) : (
              <p className="fun-joke-text">No image available</p>
            )}
            <p className="apod-title">
              {pokemonNumber ? `#${pokemonNumber} ` : ''}
              {pokemonName}
            </p>
          </div>

          <div className="rapid-rating rapid-rating-apod rapid-rating-fun fun-card" style={{ animationDelay: '270ms' }}>
            <i className="fas fa-star rapid-rating-icon" aria-hidden="true"></i>
            <p className="rapid-rating-title">Astronomy Picture</p>
            <div className="card-tools">
              <span className={`status-badge ${apodStatus}`}>{statusLabel(apodStatus)}</span>
              <button type="button" className="refresh-btn" onClick={fetchApod} aria-label="Refresh astronomy picture">
                <i className="fas fa-rotate-right" aria-hidden="true"></i>
                Refresh
              </button>
            </div>
            <p className="updated-time">{formatUpdatedTime(apodUpdatedAt)}</p>
            {apodStatus === 'loading' ? (
              <div className="skeleton-box apod"></div>
            ) : apodImageUrl ? (
              <button
                type="button"
                className="apod-image-btn"
                onClick={() => setApodModalOpen(true)}
                aria-label="Open astronomy image preview"
              >
                <img src={apodImageUrl} alt={apodTitle} className="apod-image" loading="lazy" />
              </button>
            ) : (
              <a href={apodPageUrl} target="_blank" rel="noopener noreferrer" className="rapid-rating-value">
                Open APOD
              </a>
            )}
            <p className="apod-title">{apodTitle}</p>
          </div>
        </div>

      </div>

      {apodModalOpen && (
        <div className="apod-modal" role="dialog" aria-modal="true" aria-label="Astronomy image preview" onClick={() => setApodModalOpen(false)}>
          <button
            type="button"
            className="apod-modal-close"
            onClick={() => setApodModalOpen(false)}
            aria-label="Close astronomy preview"
          >
            <i className="fas fa-xmark" aria-hidden="true"></i>
          </button>
          <img
            src={apodImageUrl}
            alt={apodTitle}
            className="apod-full-image"
            loading="lazy"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}

export default FunStuff;
