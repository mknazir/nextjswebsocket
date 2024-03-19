// components/TradingViewWidget.js
import React, { useEffect, useRef } from 'react';

function TradingViewWidget({ symbol, interval, theme, style, locale, enablePublishing, allowSymbolChange, calendar, supportHost, historicalData }) {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "${symbol}",
        "interval": "${interval}",
        "timezone": "Etc/UTC",
        "theme": "${theme}",
        "style": "${style}",
        "locale": "${locale}",
        "enable_publishing": ${enablePublishing},
        "allow_symbol_change": ${allowSymbolChange},
        "calendar": ${calendar},
        "support_host": "${supportHost}",
        "studies": [
          "MA@tv-basicstudies",
          "RSI@tv-basicstudies"
        ],
        "overrides": {
          "paneProperties.background": "#131722",
          "paneProperties.vertGridProperties.color": "#363c4e",
          "paneProperties.horzGridProperties.color": "#363c4e",
          "symbolWatermarkProperties.transparency": 90,
          "scalesProperties.textColor": "#AAA",
          "mainSeriesProperties.candleStyle.wickUpColor": "#00ff00",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ff0000"
        },
        "custom_indicators": [{
          "id": "custom MACD",
          "defaultValue": "1,50"
        }],
        "studies_overrides": {
          "volume.volume.color.0": "#00ff00",
          "volume.volume.color.1": "#ff0000",
          "volume.volume.transparency": 70,
          "macd.histogram.color": "#FFD700"
        },
        "overrides": {
          "volumePaneSize": "tiny",
        },
        "enabled_features": ["study_templates"],
        "studies_template": {
          "name": "Three Studies",
          "chartStudies": [
            {"plot_0": "Volume@tv-basicstudies"},
            {"plot_1": "MACD@tv-basicstudies"},
            {"plot_2": "RSI@tv-basicstudies"}
          ],
          "studies": [
            {"name": "MACD@tv-basicstudies", "type": "macd", "id": "macd", "title": "MACD", "ranges": ["1D"]},
            {"name": "RSI@tv-basicstudies", "type": "rsi", "id": "rsi", "title": "RSI", "ranges": ["1D"]}
          ],
          "defaults": {
            "volume.volume.transparency": 70,
            "volume.volume.color.0": "#00ff00",
            "volume.volume.color.1": "#ff0000",
            "macd.plot.color.0": "#4a90e2",
            "macd.plot.color.1": "#db7093",
            "macd.histogram.color": "#FFD700"
          },
          "palettes": {
            "linecolor": "rgba(255, 255, 255, 0.1)"
          }
        },
        "height": 610,
        "width": 980,
        "datafeed": {
          "ohlc": historicalData.ohlc,
          "volume": historicalData.volume,
          "time": historicalData.time,
          "timezone": "Etc/UTC",
          "format": "json"
        },
        "library_path": "/static/charting_library/",
      }`;
    container.current.appendChild(script);
  }, [symbol, interval, theme, style, locale, enablePublishing, allowSymbolChange, calendar, supportHost, historicalData]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default TradingViewWidget;
