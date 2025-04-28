import React, { useState } from "react";
import {PdfChartElement} from "../../store/types";

interface ChartPropertiesProps {
  element: PdfChartElement;
  onUpdate: (updates: Partial<PdfChartElement>) => void;
}

const ChartProperties: React.FC<ChartPropertiesProps> = ({ element, onUpdate }) => {
  const [expanded, setExpanded] = useState({
    type: true,
    data: true,
    options: false,
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateLabel = (index: number, value: string) => {
    const newLabels = [...element.data.labels];
    newLabels[index] = value;
    onUpdate({ data: { ...element.data, labels: newLabels } });
  };

  const addLabel = () => {
    const newLabels = [...element.data.labels, `Label ${element.data.labels.length + 1}`];
    const newDatasets = element.data.datasets.map((dataset) => ({
      ...dataset,
      data: [...dataset.data, 0],
    }));
    onUpdate({ data: { ...element.data, labels: newLabels, datasets: newDatasets } });
  };

  const removeLabel = (index: number) => {
    if (element.data.labels.length > 1) {
      const newLabels = [...element.data.labels];
      newLabels.splice(index, 1);

      const newDatasets = element.data.datasets.map((dataset) => {
        const newData = [...dataset.data];
        newData.splice(index, 1);
        return { ...dataset, data: newData };
      });

      onUpdate({ data: { ...element.data, labels: newLabels, datasets: newDatasets } });
    }
  };

  const updateDatasetName = (index: number, value: string) => {
    const newDatasets = [...element.data.datasets];
    newDatasets[index] = { ...newDatasets[index], label: value };
    onUpdate({ data: { ...element.data, datasets: newDatasets } });
  };

  const updateDataValue = (datasetIndex: number, valueIndex: number, value: number) => {
    const newDatasets = [...element.data.datasets];
    const newData = [...newDatasets[datasetIndex].data];
    newData[valueIndex] = value;
    newDatasets[datasetIndex] = { ...newDatasets[datasetIndex], data: newData };
    onUpdate({ data: { ...element.data, datasets: newDatasets } });
  };

  const addDataset = () => {
    const newDatasetCount = element.data.datasets.length + 1;
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    const newDataset = {
      label: `Dataset ${newDatasetCount}`,
      data: Array(element.data.labels.length).fill(0),
      backgroundColor: randomColor,
      borderColor: randomColor,
      borderWidth: 1,
    };

    onUpdate({ data: { ...element.data, datasets: [...element.data.datasets, newDataset] } });
  };

  const removeDataset = (index: number) => {
    if (element.data.datasets.length > 1) {
      const newDatasets = [...element.data.datasets];
      newDatasets.splice(index, 1);
      onUpdate({ data: { ...element.data, datasets: newDatasets } });
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Type Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("type")}>
          <h3 className="font-medium">Chart Type</h3>
          <span className="material-icons-outlined text-sm">{expanded.type ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.type && (
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2">
              {(["bar", "line", "pie", "doughnut", "area", "scatter"] as const).map((type) => (
                <button
                  key={type}
                  className={`p-2 border rounded ${element.chartType === type ? "bg-blue-50 border-blue-300" : "bg-white hover:bg-gray-50"}`}
                  onClick={() => onUpdate({ chartType: type })}>
                  <div className="flex flex-col items-center">
                    <span className="material-icons-outlined mb-1">
                      {type === "bar" && "bar_chart"}
                      {type === "line" && "show_chart"}
                      {type === "pie" && "pie_chart"}
                      {type === "doughnut" && "donut_large"}
                      {type === "area" && "area_chart"}
                      {type === "scatter" && "scatter_plot"}
                    </span>
                    <span className="text-xs capitalize">{type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart Data Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("data")}>
          <h3 className="font-medium">Chart Data</h3>
          <span className="material-icons-outlined text-sm">{expanded.data ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.data && (
          <div className="p-3 space-y-4">
            {/* Labels */}
            <div>
              <h4 className="font-medium text-sm mb-2">Labels</h4>
              <div className="space-y-2">
                {element.data.labels.map((label, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" className="flex-grow p-2 border rounded" value={label} onChange={(e) => updateLabel(index, e.target.value)} />
                    <button className="text-red-500 hover:text-red-700" onClick={() => removeLabel(index)}>
                      <span className="material-icons-outlined">close</span>
                    </button>
                  </div>
                ))}

                <button className="w-full px-2 py-1 border rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center" onClick={addLabel}>
                  <span className="material-icons-outlined text-sm mr-1">add</span>
                  Add Label
                </button>
              </div>
            </div>

            {/* Datasets */}
            <div>
              <h4 className="font-medium text-sm mb-2">Datasets</h4>
              <div className="space-y-4">
                {element.data.datasets.map((dataset, datasetIndex) => (
                  <div key={datasetIndex} className="border rounded p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <input type="text" className="flex-grow p-2 border rounded" value={dataset.label} onChange={(e) => updateDatasetName(datasetIndex, e.target.value)} />
                      <button className="ml-2 text-red-500 hover:text-red-700" onClick={() => removeDataset(datasetIndex)}>
                        <span className="material-icons-outlined">delete</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Color</label>
                      <div className="flex">
                        <input
                          type="color"
                          className="h-9 w-9 p-0 border rounded-l"
                          value={typeof dataset.backgroundColor === "string" ? dataset.backgroundColor : "#3b82f6"}
                          onChange={(e) => {
                            const newDatasets = [...element.data.datasets];
                            newDatasets[datasetIndex] = {
                              ...newDatasets[datasetIndex],
                              backgroundColor: e.target.value,
                              borderColor: e.target.value,
                            };
                            onUpdate({ data: { ...element.data, datasets: newDatasets } });
                          }}
                        />
                        <input
                          type="text"
                          className="flex-grow p-2 border-t border-r border-b rounded-r"
                          value={typeof dataset.backgroundColor === "string" ? dataset.backgroundColor : "#3b82f6"}
                          onChange={(e) => {
                            const newDatasets = [...element.data.datasets];
                            newDatasets[datasetIndex] = {
                              ...newDatasets[datasetIndex],
                              backgroundColor: e.target.value,
                              borderColor: e.target.value,
                            };
                            onUpdate({ data: { ...element.data, datasets: newDatasets } });
                          }}
                        />
                      </div>
                    </div>

                    <h5 className="font-medium text-xs">Values</h5>
                    <div className="overflow-x-auto border rounded">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {element.data.labels.map((label, i) => (
                              <th key={i} className="px-3 py-2 text-xs font-medium text-gray-500 uppercase text-left">
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {dataset.data.map((value, valueIndex) => (
                              <td key={valueIndex} className="px-2 py-1">
                                <input
                                  type="number"
                                  className="w-full p-1 border rounded text-sm"
                                  value={value}
                                  onChange={(e) => updateDataValue(datasetIndex, valueIndex, parseFloat(e.target.value) || 0)}
                                />
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                <button className="w-full px-2 py-1 border rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center" onClick={addDataset}>
                  <span className="material-icons-outlined text-sm mr-1">add</span>
                  Add Dataset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Options Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("options")}>
          <h3 className="font-medium">Chart Options</h3>
          <span className="material-icons-outlined text-sm">{expanded.options ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.options && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chart Title</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={element.options?.title || ""}
                onChange={(e) =>
                  onUpdate({
                    options: { ...element.options, title: e.target.value },
                  })
                }
                placeholder="Chart Title"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={element.options?.showLegend || false}
                  onChange={(e) =>
                    onUpdate({
                      options: { ...element.options, showLegend: e.target.checked },
                    })
                  }
                />
                <span className="text-sm">Show Legend</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={element.options?.showGrid || false}
                  onChange={(e) =>
                    onUpdate({
                      options: { ...element.options, showGrid: e.target.checked },
                    })
                  }
                />
                <span className="text-sm">Show Grid</span>
              </label>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Legend Position</label>
              <select
                className="w-full p-2 border rounded"
                value={element.options?.legendPosition || "top"}
                onChange={(e) =>
                  onUpdate({
                    options: {
                      ...element.options,
                      legendPosition: e.target.value as "top" | "bottom" | "left" | "right",
                    },
                  })
                }
                disabled={!element.options?.showLegend}>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartProperties;
