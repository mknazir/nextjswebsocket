'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { CrosshairMode, createChart } from 'lightweight-charts';

const Chart = ({ data, type }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (chartContainerRef.current) {
            chartRef.current = createChart(chartContainerRef.current, {
                width: 1400,
                height: 600,
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                },
            });
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
            }
        };
    }, [data, type]);

    useEffect(() => {
        if (chartRef.current && data) {
            let series;

            if (type === 'candlestick') {
                series = chartRef.current.addCandlestickSeries();
            } else if (type === 'line') {
                series = chartRef.current.addLineSeries();
            } else if (type === 'bar') {
                series = chartRef.current.addBarSeries();
            } else if (type === 'area') {
                series = chartRef.current.addAreaSeries({ lineColor: '#2962FF', topColor: '#2962FF', bottomColor: 'rgba(41, 98, 255, 0.28)' });
            } else if (type === 'heikinashi') {
                series = chartRef.current.addCandlestickSeries();
            }

            const dataArray = data.map(candle => {
                const timestamp = new Date(candle[0]).getTime();
                const newTime = (timestamp + (5.5 * 60 * 60 * 1000)) / 1000;

                if (type === 'candlestick' || type === 'bar' || type === 'heikinashi') {
                    return {
                        time: newTime,
                        open: parseFloat(candle[1]), // Open
                        high: parseFloat(candle[2]), // High
                        low: parseFloat(candle[3]), // Low
                        close: parseFloat(candle[4]), // Close
                    };
                } else if (type === 'line' || type === 'area') {
                    return {
                        time: newTime,
                        value: parseFloat(candle[1])
                    };
                }
            });

            dataArray.sort((a, b) => a.time - b.time);
            series.setData(dataArray);

            chartRef.current.applyOptions({
                crosshair: {
                    mode: CrosshairMode.Normal,
                },
                grid: {
                    // vertLines: {
                    //     visible: false,
                    // },
                    horzLines: {
                        visible: false,
                    },
                },
            });
        }
    }, [data, type]);

    return <div ref={chartContainerRef} />;
};

function getCurrentLocalTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

const HistoricCharts = () => {
    const [selectedTab, setSelectedTab] = useState('BTCUSDT');
    const [displayedCoins, setDisplayedCoins] = useState(['BTCUSDT', 'ETHUSDT']);
    const [userName , setUserName] = useState("");
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
          setSelectedTab(localStorage.getItem('selectedTab'))
          setDisplayedCoins(JSON.parse(localStorage.getItem('displayedCoins')))
          setUserName(localStorage.getItem("userName"))
        }
      }, []);
      
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState(getCurrentLocalTime());
    const [coinData, setCoinData] = useState({});
    const [dropdownCoins, setDropdownCoins] = useState([]);
    const [newCoin, setNewCoin] = useState('');

    const [selectedInterval, setSelectedInterval] = useState('1m');
    const [selectedChartType, setSelectedChartType] = useState('candlestick');
    const [selectedTimeDelta, setSelectedTimeDelta] = useState(5); // Initial time delta

    // Function to change the selected time delta
    const handleTimeDeltaChange = (delta) => {
        setSelectedTimeDelta(delta);
    };



    const processHeikinashi = (data) => {
        const cleanData = data.map((candle) => {
            return candle.map((value) => {
                return typeof value === 'string' ? parseFloat(value) : value;
            });
        });

        const firstOpen = (cleanData[0][1] + cleanData[0][4]) / 2;
        const firstClose = cleanData[0][4];

        return cleanData.reduce((acc, candle, i) => {
            const prevOpen = i === 0 ? firstOpen : acc[i - 1][1];
            const prevClose = i === 0 ? firstClose : acc[i - 1][4];

            const open = (prevOpen + prevClose) / 2;
            const close = (open + candle[1] + candle[2] + candle[4]) / 4;
            const high = Math.max(candle[2], open, close);
            const low = Math.min(candle[3], open, close);

            return [...acc, [candle[0], open, high, low, close]];
        }, []);
    };

    const processHistoricalData = (data) => {
        const processedData = {
            [selectedTab]: {
                candlestick: data.map((candle) => [
                    candle[0],
                    parseFloat(candle[1]), // Open
                    parseFloat(candle[2]), // High
                    parseFloat(candle[3]), // Low
                    parseFloat(candle[4]), // Close
                ]),
                line: data.map((candle) => [
                    candle[0],
                    parseFloat(candle[4]), // Close
                ]),
                volume: data.map((candle) => [
                    candle[0],
                    parseFloat(candle[5]), // Volume
                ]),
                heikinashi: processHeikinashi(data), // Delegate Heikin-Ashi calculation
            },
        };

        setCoinData((prevData) => ({
            ...prevData,
            ...processedData,
        }));
    };

    const fetchHistoricalData = () => {
        const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();
        const dateTimeInSeconds = Date.parse(selectedDateTime);
        const interval = selectedInterval;

        const historicalDataUrl = `https://api.binance.com/api/v3/klines?symbol=${selectedTab}&interval=${interval}&endTime=${dateTimeInSeconds}`;

        return fetch(historicalDataUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                processHistoricalData(result);
            })
            .catch(error => {
                console.error('Error fetching historical data:', error);
            });
    };

    const handleRemoveCoin = (coinToRemove) => {
        const isConfirmed = window.confirm(`Are you sure you want to remove ${coinToRemove}?`);
        if (isConfirmed) {
            const updatedDisplayedCoins = displayedCoins.filter((coin) => coin !== coinToRemove);
            setDisplayedCoins(updatedDisplayedCoins);

            setDropdownCoins([...dropdownCoins, coinToRemove]);
        }
    };

    const addNewCoin = () => {
        const selectedCoin = newCoin.toUpperCase();
        if (selectedCoin && !displayedCoins.includes(selectedCoin)) {
            setDisplayedCoins([...displayedCoins, selectedCoin]);
            setDropdownCoins(dropdownCoins.filter((coin) => coin !== selectedCoin));
            setNewCoin('');
        }
    };

    const modifyTime = (operation, delta) => {
        const [hours, minutes] = selectedTime.split(":").map(Number);
        const newTime = new Date();
        if (operation === 'add') {
                newTime.setHours(hours, minutes + delta);
        } else {
            newTime.setHours(hours, minutes - delta);
        }

        if (newTime.getHours() === 0 && (newTime.getMinutes() >= 0 && newTime.getMinutes() < delta)) {
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            setSelectedDate(nextDay.toISOString().split('T')[0]);
        }

        setSelectedTime(`${newTime.getHours().toString().padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`);
    };

    useEffect(() => {
        fetchHistoricalData();
    }, [selectedDate, selectedTime, selectedInterval, selectedTab]);

    return (
        <div className='coin-container'>
            <Tabs onSelect={(index) => setSelectedTab(displayedCoins[index])} className="tabContainer">
                <div className='detailsContainer'>
                    <div style={{ margin: "20px 0px" }}>
                        <input
                            type="text"
                            value={newCoin}
                            onChange={(e) => setNewCoin(e.target.value)}
                            placeholder="Search for a coin"
                            list="coinSuggestions"
                            className='searchInput'
                        />
                        {newCoin && (
                            <datalist id="coinSuggestions">
                                {dropdownCoins.map((coin) => (
                                    <option key={coin} value={coin} />
                                ))}
                            </datalist>
                        )}

                        <button onClick={addNewCoin} className='addButton'>Add Coin</button>
                    </div>
                    <div>
                        <h2>{userName}</h2>
                    </div>
                </div>
                <TabList className="tabList">
                    {displayedCoins.map((coin) => (
                        <Tab key={coin} className={`tab ${selectedTab === coin ? "" : ""}`}>
                            {coin}
                            <button onClick={() => handleRemoveCoin(coin)}>X</button>
                        </Tab>

                    ))}
                </TabList>

                {displayedCoins.map((coin) => (
                    <TabPanel key={coin}>
                        <div className='coin-info'>
                            <h3>{coin}</h3>
                            <p>
                                Price:{' '}
                                <span className='price'>
                                    {coinData[coin]?.line[coinData[coin]?.line.length - 1]?.[1]} USDT
                                </span>
                                <br />
                                Volume: <span className='volume'>{coinData[coin]?.volume[coinData[coin]?.volume.length - 1]?.[1]} BTC</span>
                            </p>
                        </div>
                        <div className='container'>
                            <select value={selectedChartType} onChange={(e) => setSelectedChartType(e.target.value)} className='chartType'>
                                <option value="line">Line Chart</option>
                                <option value="area">Area Chart</option>
                                <option value="candlestick">Candlestick Chart</option>
                                <option value="bar">Bar Chart</option>
                                <option value="heikinashi">Heikin-Ashi Chart</option>
                            </select>
                            <div className='intervals'>
                                <button
                                    onClick={(e) => setSelectedInterval(e.target.value)}
                                    value={"1m"}
                                    style={{ backgroundColor: selectedInterval === "1m" ? "#AFE1AF" : "" }}
                                >
                                    1m
                                </button>
                                <button
                                    onClick={(e) => setSelectedInterval(e.target.value)}
                                    value={"3m"}
                                    style={{ backgroundColor: selectedInterval === "3m" ? "#AFE1AF" : "" }}
                                >
                                    3m
                                </button>
                                <button
                                    onClick={(e) => setSelectedInterval(e.target.value)}
                                    value={"5m"}
                                    style={{ backgroundColor: selectedInterval === "5m" ? "#AFE1AF" : "" }}
                                >
                                    5m
                                </button>
                            </div>

                            <div className='date-time-inputs'>
                                <input type='date' value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                <input type='time' value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
                            </div>
                            <div className='time-modifier'>
                                <button className='modifierButton' onClick={() => modifyTime('subtract', selectedTimeDelta)}>-{selectedTimeDelta} min</button>
                                <button className='modifierButton' onClick={() => modifyTime('add', selectedTimeDelta)}>+{selectedTimeDelta} min</button>
                                <select value={selectedTimeDelta} onChange={(e) => handleTimeDeltaChange(parseInt(e.target.value))}>
                                    <option value="3">3 min</option>
                                    <option value="5">5 min</option>
                                    <option value="10">10 min</option>
                                    <option value="15">15 min</option>
                                </select>
                            </div>
                        </div>
                        <div className='userName'>
                            <h3>{selectedChartType}</h3>
                        </div>
                        <div className='chart'>
                            {(selectedChartType === 'line' || selectedChartType === 'area') && (
                                <Chart data={coinData[coin]?.line} type={selectedChartType} />
                            )}
                            {(selectedChartType === 'candlestick' || selectedChartType === 'bar') && (
                                <Chart data={coinData[coin]?.candlestick} type={selectedChartType} />
                            )}
                            {selectedChartType === 'heikinashi' && (
                                <Chart data={coinData[coin]?.heikinashi} type={selectedChartType} />
                            )}
                        </div>
                    </TabPanel>
                ))}
            </Tabs>
        </div>
    );
};

export default HistoricCharts;