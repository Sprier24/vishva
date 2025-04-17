'use client';
import React, { useState, useEffect, useRef } from "react";
import { Chart } from 'chart.js/auto'; 
import { FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import { Tooltip } from "react-tooltip";

const statuses = ["Proposal", "New", "Discussion", "Demo", "Decided"];

export default function CardChart() {
  const [selectedChartType, setSelectedChartType] = useState("line");
  const [chartData, setChartData] = useState({});
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const statusData = {};
        let  total = 0;

        for (const status of statuses) {
          const response = await fetch(`http://localhost:8000/api/v1/deal/getDealsByStatus?status=${status}`);
          const data = await response.json();
          
          if (data.success) {
            const totalAmount = data.data.reduce((sum, deal) => sum + deal.amount, 0);
            statusData[status] = totalAmount;
            total += totalAmount; 
          }
        }

        setChartData(statusData);
        setTotalAmount(total); 
      } catch (error) {
        console.error("Error fetching deal data:", error);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    if (!chartData || Object.keys(chartData).length === 0) return;

    const ctx = chartRef.current.getContext("2d");

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: selectedChartType,
      data: {
        labels: statuses,
        datasets: [
          {
            label: `${new Date().getFullYear()} Deal Values`,
            backgroundColor: selectedChartType === "bar" ? "#3182ce" : "rgba(49, 130, 206, 0.5)",
            borderColor: "#3182ce",
            data: statuses.map(status => chartData[status] || 0),
            fill: selectedChartType === "line" ? false : true,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "black" },
            align: "end",
            position: "bottom",
          },
          title: {
            display: false,
            text: "Sales Charts",
            color: "black",
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Deal Status",
              color: "black",
              font: { size: 14 },
            },
            ticks: { color: "black" },
            grid: { display: true, color: "rgba(200, 200, 200, 0.3)" }, 
          },
          y: {
            title: {
              display: true,
              text: `Total Deal Value  (₹${totalAmount.toLocaleString()})`,
              color: "black",
              font: { size: 14 },
            },
            ticks: { color: "black" },
            grid: { display: true, color: "rgba(200, 200, 200, 0.3)" },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData, selectedChartType,totalAmount]);

  return (
  <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-700 border border-gray-150">
    <h1 className="text-3xl font-bold mb-1 mt-6 text-center">Deal Record</h1>
    <h1 className="text-1xl mb-6 text-center">Manage and track your deals effectively</h1>
      <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
        <div className="flex flex-wrap items-center justify-between">
          <div className="relative w-full max-w-full flex-grow flex-1">
            <h6 className="uppercase text-blueGray-100 mb-1 text-xs font-semibold">Overview</h6>
            <h2 className="text-black text-blueGray-100 font-semibold">Total Deal Value (₹ {totalAmount.toLocaleString()})</h2>
          </div>

          <div className="flex gap-2 bg-gray-200 p-1 rounded-md">
            <button 
              onClick={() => setSelectedChartType("line")} 
              data-tooltip-id="line-chart-tooltip"
              className={`p-2 rounded-md transition-colors ${selectedChartType === "line" ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}
            >
              <FiTrendingUp className="text-gray-700" />
            </button>
            <Tooltip id="line-chart-tooltip" place="top" content="Line Chart" />

            <button 
              onClick={() => setSelectedChartType("bar")} 
              data-tooltip-id="bar-chart-tooltip"
              className={`p-2 rounded-md transition-colors ${selectedChartType === "bar" ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}
            >
              <FiBarChart2 className="text-gray-700" />
            </button>
            <Tooltip id="bar-chart-tooltip" place="top" content="Bar Chart" />
          </div>
        </div>
      </div>

      <div className="p-4 flex-auto">
        <div className="relative" style={{ height: "500px", width: "100%" }}>
          <canvas ref={chartRef} style={{ height: "100%", width: "100%" }}></canvas>
        </div>
      </div>
    </div>
  );
}