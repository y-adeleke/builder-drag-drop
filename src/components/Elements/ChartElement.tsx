import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from "chart.js";
import { Bar, Line, Pie, Doughnut, Scatter } from "react-chartjs-2";
import { PdfChartElement as ChartElementType } from "../../store/types";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

interface ChartElementProps {
  element: ChartElementType;
}

const ChartElement: React.FC<ChartElementProps> = ({ element }) => {
  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: element.backgroundColor,
  };

  // Add shadow if enabled
  if (element.shadow?.enabled) {
    containerStyle.boxShadow = `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.spread || 0}px ${element.shadow.color}`;
  }

  // Add border if enabled
  if (element.border?.enabled) {
    containerStyle.border = `${element.border.width}px ${element.border.style} ${element.border.color}`;
    containerStyle.borderRadius = `${element.border.radius}px`;
  }

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: element.options?.showLegend || false,
        position: element.options?.legendPosition || "top",
      },
      title: {
        display: !!element.options?.title,
        text: element.options?.title || "",
      },
    },
    scales: {
      x: {
        grid: {
          display: element.options?.showGrid || false,
        },
      },
      y: {
        grid: {
          display: element.options?.showGrid || false,
        },
      },
    },
  };

  const chartData = {
    labels: element.data.labels,
    datasets: element.data.datasets,
  };

  // Render different chart types
  const renderChart = () => {
    switch (element.chartType) {
      case "bar":
        return <Bar id={`chart-${element.id}`} data={chartData} options={options} />;
      case "line":
        return <Line id={`chart-${element.id}`} data={chartData} options={options} />;
      case "pie":
        return <Pie id={`chart-${element.id}`} data={chartData} options={options} />;
      case "doughnut":
        return <Doughnut id={`chart-${element.id}`} data={chartData} options={options} />;
      case "scatter":
        return <Scatter id={`chart-${element.id}`} data={chartData} options={options} />;
      case "area": {
        const areaData = {
          ...chartData,
          datasets: chartData.datasets.map((dataset) => ({
            ...dataset,
            fill: true,
          })),
        };
        return <Line id={`chart-${element.id}`} data={areaData} options={options} />;
      }
      default:
        return (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <span>Unsupported chart type</span>
          </div>
        );
    }
  };

  return <div style={containerStyle}>{renderChart()}</div>;
};

export default ChartElement;
