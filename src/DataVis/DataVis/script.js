// Countries Names for Slicer
const countryNameToIso3 = {
  "Argentina": "ARG",
  "Australia": "AUS",
  "Austria": "AUT",
  "Belgium": "BEL",
  "Bulgaria": "BGR",
  "Brazil": "BRA",
  "Canada": "CAN",
  "Switzerland": "CHE",
  "Chile": "CHL",
  "China": "CHN",
  "Colombia": "COL",
  "Costa Rica": "CRI",
  "Cyprus": "CYP",
  "Czechia": "CZE",
  "Germany": "DEU",
  "Denmark": "DNK",
  "Spain": "ESP",
  "Estonia": "EST",
  "European Union": "EU",
  "European Union (27 countries from 01/02/2020)": "EU27_2020",
  "European Union (28 countries)": "EU28",
  "Finland": "FIN",
  "France": "FRA",
  "United Kingdom": "GBR",
  "Greece": "GRC",
  "Croatia": "HRV",
  "Hungary": "HUN",
  "Indonesia": "IDN",
  "India": "IND",
  "Ireland": "IRL",
  "Iceland": "ISL",
  "Israel": "ISR",
  "Italy": "ITA",
  "Japan": "JPN",
  "Kazakhstan": "KAZ",
  "Korea": "KOR",
  "Lithuania": "LTU",
  "Luxembourg": "LUX",
  "Latvia": "LVA",
  "Mexico": "MEX",
  "Malta": "MLT",
  "Netherlands": "NLD",
  "Norway": "NOR",
  "New Zealand": "NZL",
  "Peru": "PER",
  "Philippines": "PHL",
  "Poland": "POL",
  "Portugal": "PRT",
  "Romania": "ROU",
  "Russia": "RUS",
  "Slovak Republic": "SVK",
  "Slovenia": "SVN",
  "Sweden": "SWE",
  "Turkey": "TUR",
  "Ukraine": "UKR",
  "United States": "USA",
  "Viet Nam": "VNM",
  "South Africa": "ZAF"
};

// Modern color palette with gradients
const colors = {
  primary: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'],
  secondary: ['#10b981', '#06b6d4', '#84cc16', '#eab308'],
  accent: ['#f59e0b', '#ef4444', '#ec4899', '#14b8a6'],
  neutral: ['#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6'],
  gradients: {
    water: ['#0ea5e9', '#0284c7'],
    nutrient: ['#10b981', '#059669'],
    energy: ['#f59e0b', '#d97706'],
    land: ['#8b5cf6', '#6d28d9']
  }
};

// Global data variables
let water = [];
let nutrients = [];
let energy = [];
let land = [];

// Load Plotly from CDN
const PLOTLY_CDN = 'https://cdn.plot.ly/plotly-latest.min.js';
const script = document.createElement('script');
script.src = PLOTLY_CDN;
document.head.appendChild(script);

// Function to parse CSV with proper number handling
function parseCSV(text) {
  return d3.csvParse(text, d => {
    Object.keys(d).forEach(key => {
      if (d[key] && typeof d[key] === 'string') {
        const cleanValue = d[key].replace(/,/g, '');
        if (!isNaN(cleanValue) && cleanValue !== '') {
          d[key] = +cleanValue;
        }
      }
    });
    return d;
  });
}

function loadData() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const controlsEl = document.querySelector('.controls');
  const metricsEl = document.querySelector('.metrics-grid');
  const chartsEl = document.querySelector('.charts-grid');
  const resourceTabs = document.getElementById('resource-tabs');

  Promise.all([
    d3.json('water_data.json'),
    d3.json('nutrients_data.json'),
    d3.json('energy_data.json'),
    d3.json('land_data.json')
  ])
    .then(([waterData, nutrientsData, energyData, landData]) => {
      // Clean water data
      water = waterData
        .filter(d => d.WATER_TYPE_CODE === '*T' || d.WATER_TYPE_CODE === '_T')
        .map(d => ({
          ...d,
          OBS_VALUE_MIL_M3: parseFloat((d.OBS_VALUE_MIL_M3 || '0').replace(/,/g, '')),
          TIME_PERIOD: +d.TIME_PERIOD
        }));

      // Clean nutrients data
      nutrients = nutrientsData
        .filter(d => d.NUTRIENTS === 'NITROGEN')
        .map(d => ({
          ...d,
          OBS_VALUE_UNIT_KG: parseFloat((d.OBS_VALUE_UNIT_KG || '0').replace(/,/g, '')),
          TIME_PERIOD: +d.TIME_PERIOD
        }));

      // Clean energy data (TOTNRJ)
      energy = energyData
        .filter(d => d.MEASURE_CODE === 'TOTNRJ')
        .map(d => ({
          ...d,
          OBS_VALUE_THOUSANDS: parseFloat((d.OBS_VALUE_THOUSANDS || '0').replace(/,/g, '')),
          TIME_PERIOD: +d.TIME_PERIOD
        }));

      // Clean land data (rename field and parse)
      land = landData.map(d => ({
        ...d,
        REF_AREA_NAME: d["REF_CODE_ NAME"] || d.REF_AREA_NAME,
        OBS_VALUE_THOUSAND_H2: parseFloat((d.OBS_VALUE_THOUSAND_H2 || '0').replace(/,/g, '')),
        TIME_PERIOD: +d.TIME_PERIOD
      }));

      // Validate data
      if (!water.length || !nutrients.length || !energy.length || !land.length) {
        throw new Error("Missing or invalid data.");
      }

      loadingEl.style.display = 'none';
      controlsEl.style.display = 'flex';
      metricsEl.style.display = 'grid';
      chartsEl.style.display = 'grid';
      resourceTabs.style.display = 'flex';

      initializeDashboard();
    })
    .catch(error => {
      console.error('Error loading JSON data:', error);
      loadingEl.style.display = 'none';
      errorEl.style.display = 'flex';
      errorEl.textContent = `Error loading data: ${error.message}`;
    });
}

function initializeDashboard() {
  const allYears = new Set();
  const allCountries = new Set();

  [water, nutrients, energy, land].forEach(dataset => {
    dataset.forEach(d => {
      if (d.TIME_PERIOD) allYears.add(d.TIME_PERIOD);
      if (d.REF_AREA_NAME) allCountries.add(d.REF_AREA_NAME);
    });
  });

  const years = [...allYears].sort((a, b) => a - b);
  const countries = [...allCountries].sort();

  const yearSelect = d3.select("#year-select");
  yearSelect.append("option").text("All Years").attr("value", "All");
  years.forEach(year => {
    yearSelect.append("option").text(year).attr("value", year);
  });
  yearSelect.property("value", "All");

  const countrySelect = d3.select("#country-select");
  countrySelect.append("option").text("All Countries").attr("value", "All");
  countries.forEach(country => {
    countrySelect.append("option").text(country).attr("value", country);
  });
  countrySelect.property("value", "All");

  // Event handlers cho dropdown Year & Country
  yearSelect.on("change", function() {
    const selectedYear = this.value;
    const selectedCountry = countrySelect.property("value");
    // Lấy resource hiện hành từ tab active
    const selectedResource = d3.select(".resource-tabs .tab.active").attr("data-resource");
    updateDashboard(selectedYear, selectedCountry, selectedResource);
  });

  countrySelect.on("change", function() {
    const selectedYear = yearSelect.property("value");
    const selectedCountry = this.value;
    const selectedResource = d3.select(".resource-tabs .tab.active").attr("data-resource");
    updateDashboard(selectedYear, selectedCountry, selectedResource);
  });

  // Xử lý sự kiện cho Resource Tabs
  d3.selectAll('.resource-tabs .tab').on('click', function() {
    d3.selectAll('.resource-tabs .tab').classed('active', false);
    d3.select(this).classed('active', true);
    const selectedYear = yearSelect.property("value");
    const selectedCountry = countrySelect.property("value");
    const selectedResource = d3.select(this).attr("data-resource");
    updateDashboard(selectedYear, selectedCountry, selectedResource);
  });

  d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

  // Add hover tooltips for metric cards
  d3.selectAll(".metric-card").on("mouseover", function(event) {
    const tooltipText = d3.select(this).attr("data-tooltip");
    showTooltip(event, tooltipText);
  }).on("mouseout", hideTooltip);

  script.onload = function() {
    updateDashboard("All", "All", "water");
  };
}

function updateDashboard(selectedYear, selectedCountry, selectedResource) {
  const selectedCountries = selectedCountry === "All" ?
    [...new Set([...water, ...nutrients, ...energy, ...land].map(d => d.REF_AREA_NAME))] :
    [selectedCountry];
  const yearFilter = selectedYear === "All" ?
    [...new Set([...water, ...nutrients, ...energy, ...land].map(d => d.TIME_PERIOD))].filter(y => y) :
    [+selectedYear];

  d3.selectAll('.metric-card').classed('fade-in', true);

  updateKPI(water, yearFilter, selectedCountries, 'water', 'OBS_VALUE_MIL_M3', 'M', 'Water Use (Million m³)');
  updateKPI(nutrients, yearFilter, selectedCountries, 'nutrient', 'OBS_VALUE_UNIT_KG', '', 'Nutrient Balance (kg/ha)');
  updateKPI(energy, yearFilter, selectedCountries, 'energy', 'OBS_VALUE_THOUSANDS', 'K', 'Energy Use (Thousand TOE)');
  updateKPI(land, yearFilter, selectedCountries, 'land', 'OBS_VALUE_THOUSAND_H2', 'K', 'Land Area (Thousand ha)');

  updateTimeSeriesChart(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource);
  updateChoroplethMap(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource);
  updateScatterPlot(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource);
  updateBarChart(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource);
  // updatePieChart(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource);
  updateStackedBarChart(water, nutrients, energy, land, yearFilter, selectedCountries);
  updateHeatmap(water, nutrients, energy, land, yearFilter, selectedCountries);

  const filterText = `${selectedYear === "All" ? "All Years" : selectedYear} • ${selectedCountry === "All" ? "All Countries" : selectedCountry} • ${selectedResource.charAt(0).toUpperCase() + selectedResource.slice(1)}`;
  d3.selectAll('.chart-subtitle').text(filterText);
}

function updateKPI(data, yearFilter, selectedCountries, type, valueField, suffix, unit) {
  const filtered = data.filter(d =>
    yearFilter.includes(d.TIME_PERIOD) &&
    selectedCountries.includes(d.REF_AREA_NAME) &&
    d[valueField] != null && !isNaN(d[valueField])
  );

  const current = filtered.length > 0 ? d3.mean(filtered, d => d[valueField]) : 0;
  const formattedValue = formatNumber(current) + suffix;

  const valueElement = d3.select(`#${type}-value`);
  valueElement.transition()
    .duration(800)
    .tween('text', function() {
      const i = d3.interpolate(0, current);
      return function(t) {
        this.textContent = formatNumber(i(t)) + suffix;
      };
    });

  const trendElement = d3.select(`#${type}-trend`);
  if (filtered.length > 1) {
    const sortedData = filtered.sort((a, b) => a.TIME_PERIOD - b.TIME_PERIOD);
    const firstYear = sortedData[0][valueField];
    const lastYear = sortedData[sortedData.length - 1][valueField];
    const trendValue = ((lastYear - firstYear) / firstYear) * 100;
    const avg = d3.mean(filtered, d => d[valueField]);
    const regionalAvg = d3.mean(data.filter(d => yearFilter.includes(d.TIME_PERIOD) && d[valueField] != null), d => d[valueField]);
    const trendText = `${trendValue > 0 ? '+' : ''}${trendValue.toFixed(1)}% trend<br>Regional Avg: ${formatNumber(regionalAvg)}${suffix} ${unit.split('(')[1]}`;

    trendElement.html(trendText)
      .style('color', trendValue > 0 ? '#10b981' : '#ef4444');
  } else {
    trendElement.text('Insufficient data for trend');
  }
}

function formatNumber(num) {
  if (isNaN(num) || num == null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(1);
}

function updateTimeSeriesChart(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource) {
  const data = selectedResource === 'water' ? water : selectedResource === 'nutrient' ? nutrients : selectedResource === 'energy' ? energy : land;
  const valueField = selectedResource === 'water' ? 'OBS_VALUE_MIL_M3' : selectedResource === 'nutrient' ? 'OBS_VALUE_UNIT_KG' : selectedResource === 'energy' ? 'OBS_VALUE_THOUSANDS' : 'OBS_VALUE_THOUSAND_H2';
  const unit = selectedResource === 'water' ? 'Million m³' : selectedResource === 'nutrient' ? 'kg/ha' : selectedResource === 'energy' ? 'Thousand TOE' : 'Thousand ha';

  const filtered = data.filter(d =>
    selectedCountries.includes(d.REF_AREA_NAME) &&
    d[valueField] != null && !isNaN(d[valueField])
  );

  if (filtered.length === 0) {
    Plotly.newPlot('time-series', [], {
      title: 'Resource Consumption Trends',
      xaxis: { title: 'Year' },
      yaxis: { title: unit },
      annotations: [{
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: 0.5,
        text: 'No data available',
        showarrow: false,
        font: { size: 14, color: colors.neutral[0] }
      }],
      margin: { t: 40, b: 40, l: 60, r: 80 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    });
    return;
  }

  const countriesData = d3.group(filtered, d => d.REF_AREA_NAME);
  const topCountries = Array.from(countriesData.entries())
    .map(([country, values]) => ({
      country,
      avg: d3.mean(values, d => d[valueField])
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);

  const traces = topCountries.map((countryInfo, i) => {
    const countryData = countriesData.get(countryInfo.country).sort((a, b) => a.TIME_PERIOD - b.TIME_PERIOD);
    return {
      x: countryData.map(d => d.TIME_PERIOD),
      y: countryData.map(d => d[valueField]),
      type: 'scatter',
      mode: 'lines+markers',
      name: countryInfo.country,
      line: { color: colors.primary[i], width: 2, shape: 'spline' },
      marker: { size: 8, line: { color: 'white', width: 1 } },
      hovertemplate: `%{meta}<br>%{x}: %{y:.1f} ${unit}<extra></extra>`,
      meta: countryInfo.country
    };
  });

  const layout = {
    title: 'Resource Consumption Trends',
    xaxis: { title: 'Year', type: 'linear', tickformat: 'd' },
    yaxis: { title: unit },
    showlegend: true,
    legend: { x: 1.1, y: 1, bgcolor: 'rgba(255,255,255,0.8)', bordercolor: colors.neutral[2] },
    margin: { t: 40, b: 40, l: 60, r: 80 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    hovermode: 'closest'
  };

  Plotly.newPlot('time-series', traces, layout, { displayModeBar: false, displaylogo: false });
}

function updateChoroplethMap(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource) {
  const data = selectedResource === 'water' ? water : selectedResource === 'nutrient' ? nutrients : selectedResource === 'energy' ? energy : land;
  const valueField = selectedResource === 'water' ? 'OBS_VALUE_MIL_M3' : selectedResource === 'nutrient' ? 'OBS_VALUE_UNIT_KG' : selectedResource === 'energy' ? 'OBS_VALUE_THOUSANDS' : 'OBS_VALUE_THOUSAND_H2';
  const unit = selectedResource === 'water' ? 'Million m³' : selectedResource === 'nutrient' ? 'kg/ha' : selectedResource === 'energy' ? 'Thousand TOE' : 'Thousand ha';

  const filtered = data.filter(d =>
    yearFilter.includes(d.TIME_PERIOD) &&
    d[valueField] != null && !isNaN(d[valueField])
  );

  if (filtered.length === 0) {
    Plotly.newPlot('choropleth', [], {
      title: 'Global Resource Distribution',
      geo: { showframe: false, projection: { type: 'natural earth' } },
      annotations: [{
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: 0.5,
        text: 'No data available',
        showarrow: false,
        font: { size: 14, color: colors.neutral[0] }
      }],
      margin: { t: 40, b: 20, l: 20, r: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    });
    return;
  }

  const countryData = d3.rollup(filtered, v => d3.mean(v, d => d[valueField]), d => d.REF_AREA_NAME);
  const values = [];
  const locations = [];

  countryData.forEach((value, country) => {
    const iso = countryNameToIso3[country];
    if (iso && !isNaN(value)) {
      locations.push(iso);
      values.push(value);
    }
  });

  const colorscales = {
    water: [ [0, '#a5f3fc'], [0.5, '#0ea5e9'], [1, '#1e3a8a'] ],
    nutrient: [ [0, '#fef08a'], [0.5, '#84cc16'], [1, '#166534'] ],
    energy: [ [0, '#fde68a'], [0.5, '#f97316'], [1, '#7c2d12'] ],
    land: [ [0, '#ddd6fe'], [0.5, '#8b5cf6'], [1, '#4c1d95'] ]
  };

  const trace = {
    type: 'choropleth',
    locations: locations,
    z: values,
    locationmode: 'ISO-3',
    colorscale: colorscales[selectedResource],
    zmin: d3.min(values),
    zmax: d3.max(values),
    colorbar: { title: unit },
    hovertemplate: `%{location}<br>%{z:.1f} ${unit}<extra></extra>`
  };

  let highlightTrace = null;
  if (selectedCountries.length > 0 && yearFilter.length === 1) {
    const highlight = filtered.filter(d => selectedCountries.includes(d.REF_AREA_NAME));
    highlightTrace = {
      type: 'choropleth',
      locationmode: 'ISO-3',
      locations: highlight.map(d => d.REF_AREA_CODE),
      z: new Array(highlight.length).fill(0),
      colorscale: [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']],
      marker: {
        line: {
          color: 'black',
          width: 0.5
        }
      },
      showscale: false,
      hoverinfo: 'skip'
    };
  }

  const layout = {
    title: 'Global Resource Distribution',
    geo: {
      showframe: false,
      projection: { type: 'natural earth' },
      showcoastlines: true,
      coastlinecolor: 'white',
      coastlinewidth: 0.5
    },
    margin: { t: 40, b: 20, l: 20, r: 20 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };

  const traces = highlightTrace ? [trace, highlightTrace] : [trace];
  Plotly.newPlot('choropleth', traces, layout, { displayModeBar: false, displaylogo: false });
}

function updateScatterPlot(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource) {
  const xData = selectedResource === 'water' ? water : selectedResource === 'nutrient' ? nutrients : selectedResource === 'energy' ? energy : land;
  const yData = selectedResource === 'water' ? land : selectedResource === 'nutrient' ? water : selectedResource === 'energy' ? nutrients : energy;
  const xValueField = selectedResource === 'water' ? 'OBS_VALUE_MIL_M3' : selectedResource === 'nutrient' ? 'OBS_VALUE_UNIT_KG' : selectedResource === 'energy' ? 'OBS_VALUE_THOUSANDS' : 'OBS_VALUE_THOUSAND_H2';
  const yValueField = selectedResource === 'water' ? 'OBS_VALUE_THOUSAND_H2' : selectedResource === 'nutrient' ? 'OBS_VALUE_MIL_M3' : selectedResource === 'energy' ? 'OBS_VALUE_UNIT_KG' : 'OBS_VALUE_THOUSANDS';
  const xUnit = selectedResource === 'water' ? 'Million m³' : selectedResource === 'nutrient' ? 'kg/ha' : selectedResource === 'energy' ? 'Thousand TOE' : 'Thousand ha';
  const yUnit = selectedResource === 'water' ? 'Thousand ha' : selectedResource === 'nutrient' ? 'Million m³' : selectedResource === 'energy' ? 'kg/ha' : 'Thousand TOE';

  const scatterData = xData
    .filter(d =>
      yearFilter.includes(d.TIME_PERIOD) &&
      selectedCountries.includes(d.REF_AREA_NAME) &&
      d[xValueField] != null && !isNaN(d[xValueField])
    )
    .map(d => {
      const yValue = yData.find(l =>
        l.REF_AREA_CODE === d.REF_AREA_CODE &&
        l.TIME_PERIOD === d.TIME_PERIOD &&
        l[yValueField] != null && !isNaN(l[yValueField])
      );
      return {
        x: d[xValueField],
        y: yValue ? yValue[yValueField] : null,
        country: d.REF_AREA_NAME,
        year: d.TIME_PERIOD
      };
    })
    .filter(d => d.y !== null && d.y > 0);

  if (scatterData.length === 0) {
    Plotly.newPlot('scatter', [], {
      title: 'Resource Correlation',
      xaxis: { title: xUnit },
      yaxis: { title: yUnit },
      annotations: [{
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: 0.5,
        text: 'No matching data available',
        showarrow: false,
        font: { size: 14, color: colors.neutral[0] }
      }],
      margin: { t: 40, b: 50, l: 60, r: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    });
    return;
  }

  const trace = {
    x: scatterData.map(d => d.x),
    y: scatterData.map(d => d.y),
    mode: 'markers',
    type: 'scatter',
    text: scatterData.map(d => `${d.country} (${d.year})`),
    marker: { size: 12, color: colors.gradients[selectedResource][0], opacity: 0.7, line: { color: 'white', width: 1 } },
    hovertemplate: `%{text}<br>${xUnit}: %{x:.1f}<br>${yUnit}: %{y:.1f}<extra></extra>`
  };

  const layout = {
    title: 'Resource Correlation',
    xaxis: { title: xUnit },
    yaxis: { title: yUnit },
    showlegend: false,
    margin: { t: 40, b: 50, l: 60, r: 20 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    hovermode: 'closest'
  };

  Plotly.newPlot('scatter', [trace], layout, { displayModeBar: false, displaylogo: false });
}

function updateBarChart(water, nutrients, energy, land, yearFilter, selectedCountries, selectedResource) {
  const data = selectedResource === 'water' ? water : selectedResource === 'nutrient' ? nutrients : selectedResource === 'energy' ? energy : land;
  const valueField = selectedResource === 'water' ? 'OBS_VALUE_MIL_M3' : selectedResource === 'nutrient' ? 'OBS_VALUE_UNIT_KG' : selectedResource === 'energy' ? 'OBS_VALUE_THOUSANDS' : 'OBS_VALUE_THOUSAND_H2';
  const unit = selectedResource === 'water' ? 'Million m³' : selectedResource === 'nutrient' ? 'kg/ha' : selectedResource === 'energy' ? 'Thousand TOE' : 'Thousand ha';

  const filtered = data.filter(d =>
    yearFilter.includes(d.TIME_PERIOD) &&
    selectedCountries.includes(d.REF_AREA_NAME) &&
    d[valueField] != null && !isNaN(d[valueField])
  );

  if (filtered.length === 0) {
    Plotly.newPlot('bar', [], {
      title: 'Country Comparison',
      xaxis: { title: 'Country' },
      yaxis: { title: unit },
      annotations: [{
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: 0.5,
        text: 'No data available',
        showarrow: false,
        font: { size: 14, color: colors.neutral[0] }
      }],
      margin: { t: 40, b: 80, l: 60, r: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    });
    return;
  }

  const barData = Array.from(
    d3.rollup(filtered, v => d3.mean(v, d => d[valueField]), d => d.REF_AREA_NAME),
    ([country, value]) => ({ country, value })
  ).sort((a, b) => b.value - a.value).slice(0, 10);

  const trace = {
    x: barData.map(d => d.country),
    y: barData.map(d => d.value),
    type: 'bar',
    marker: { color: colors.gradients[selectedResource][1], line: { color: colors.gradients[selectedResource][0], width: 1 } },
    hovertemplate: `%{x}<br>%{y:.1f} ${unit}<br>Rank: %{customdata}<extra></extra>`,
    customdata: barData.map((d, i) => i + 1)
  };

  const layout = {
    title: 'Country Comparison',
    xaxis: { title: 'Country', tickangle: 45 },
    yaxis: { title: unit },
    showlegend: false,
    margin: { t: 40, b: 80, l: 60, r: 20 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };

  Plotly.newPlot('bar', [trace], layout, { displayModeBar: false, displaylogo: false });
}

// Optional: updatePieChart (nếu muốn kích hoạt)
// function updatePieChart(...) { ... }

function updateStackedBarChart(water, nutrients, energy, land, yearFilter, selectedCountries) {
  const selectedCountry = selectedCountries.length === 1 ? selectedCountries[0] : null;

  const filteredWater = water.filter(d => yearFilter.includes(d.TIME_PERIOD) && d.OBS_VALUE_MIL_M3 != null && !isNaN(d.OBS_VALUE_MIL_M3));
  const filteredEnergy = energy.filter(d => yearFilter.includes(d.TIME_PERIOD) && d.OBS_VALUE_THOUSANDS != null && !isNaN(d.OBS_VALUE_THOUSANDS));

  // Compute average for top countries
  const countryScores = {};

  [...new Set([...filteredWater.map(d => d.REF_AREA_NAME), ...filteredEnergy.map(d => d.REF_AREA_NAME)])].forEach(country => {
    const waterAvg = d3.mean(filteredWater.filter(d => d.REF_AREA_NAME === country), d => d.OBS_VALUE_MIL_M3) || 0;
    const energyAvg = d3.mean(filteredEnergy.filter(d => d.REF_AREA_NAME === country), d => d.OBS_VALUE_THOUSANDS) || 0;
    countryScores[country] = waterAvg + energyAvg;
  });

  // Sort and select top 10
  const topCountries = Object.entries(countryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country]) => country);

  // Ensure selected country is included
  if (selectedCountry && !topCountries.includes(selectedCountry)) {
    topCountries.push(selectedCountry);
  }

  if (topCountries.length === 0) {
    Plotly.newPlot('stacked-bar', [], {
      title: 'Resource Composition',
      xaxis: { title: 'Country' },
      yaxis: { title: 'Value' },
      annotations: [{
        xref: 'paper', yref: 'paper', x: 0.5, y: 0.5,
        text: 'No data available', showarrow: false,
        font: { size: 14, color: colors.neutral[0] }
      }],
      margin: { t: 40, b: 80, l: 60, r: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)'
    });
    return;
  }

  function barOpacity(c) {
    return !selectedCountry || c === selectedCountry ? 1 : 0.3;
  }

  const traceWater = {
    x: topCountries,
    y: topCountries.map(c => {
      const vals = filteredWater.filter(d => d.REF_AREA_NAME === c);
      return vals.length > 0 ? d3.mean(vals, d => d.OBS_VALUE_MIL_M3) : 0;
    }),
    name: 'Water Use',
    type: 'bar',
    marker: {
      color: colors.gradients.water[0],
      opacity: 1,
    },
    hovertemplate: `%{x}<br>Water: %{y:.1f} Million m³<extra></extra>`,
    opacity: 1,
  };

  const traceEnergy = {
    x: topCountries,
    y: topCountries.map(c => {
      const vals = filteredEnergy.filter(d => d.REF_AREA_NAME === c);
      return vals.length > 0 ? d3.mean(vals, d => d.OBS_VALUE_THOUSANDS) : 0;
    }),
    name: 'Energy Use',
    type: 'bar',
    marker: {
      color: colors.gradients.energy[0],
    },
    hovertemplate: `%{x}<br>Energy: %{y:.1f} Thousand TOE<extra></extra>`,
  };

  // Apply per-bar opacity
  traceWater.marker.opacity = topCountries.map(barOpacity);
  traceEnergy.marker.opacity = topCountries.map(barOpacity);

  const layout = {
    title: 'Resource Composition',
    xaxis: { title: 'Country', tickangle: 45 },
    yaxis: { title: 'Value' },
    barmode: 'stack',
    showlegend: true,
    legend: { x: 1, y: 1, bgcolor: 'rgba(255,255,255,0.8)', bordercolor: colors.neutral[2] },
    margin: { t: 40, b: 80, l: 60, r: 20 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };

  Plotly.newPlot('stacked-bar', [traceWater, traceEnergy], layout, { displayModeBar: false, displaylogo: false });
}

function updateHeatmap(water, nutrients, energy, land, yearFilter, selectedCountries) {
  const resources = [
    { name: 'Water Use', data: water, field: 'OBS_VALUE_MIL_M3', unit: 'Million m³' },
    { name: 'Nutrient Balance', data: nutrients, field: 'OBS_VALUE_UNIT_KG', unit: 'kg/ha' },
    { name: 'Energy Use', data: energy, field: 'OBS_VALUE_THOUSANDS', unit: 'Thousand TOE' },
    { name: 'Land Area', data: land, field: 'OBS_VALUE_THOUSAND_H2', unit: 'Thousand ha' }
  ];

  const zValues = resources.map(r1 =>
    resources.map(r2 => {
      const filtered1 = r1.data.filter(d => yearFilter.includes(d.TIME_PERIOD) && selectedCountries.includes(d.REF_AREA_NAME) && d[r1.field] != null && !isNaN(d[r1.field]));
      const filtered2 = r2.data.filter(d => yearFilter.includes(d.TIME_PERIOD) && selectedCountries.includes(d.REF_AREA_NAME) && d[r2.field] != null && !isNaN(d[r2.field]));
      const paired = filtered1.map(d1 => {
        const d2 = filtered2.find(d => d.REF_AREA_CODE === d1.REF_AREA_CODE && d.TIME_PERIOD === d1.TIME_PERIOD);
        return d2 ? [d1[r1.field], d2[r2.field]] : null;
      }).filter(d => d !== null);
      if (paired.length === 0) return 0;
      const corr = d3.mean(paired, d => (d[0] - d3.mean(paired, p => p[0])) * (d[1] - d3.mean(paired, p => p[1]))) /
                   (d3.deviation(paired, p => p[0]) * d3.deviation(paired, p => p[1]));
      return isNaN(corr) ? 0 : corr;
    })
  );

  if (zValues.every(row => row.every(v => v === 0))) {
    Plotly.newPlot('heatmap', [], {
      title: 'Resource Correlation Matrix',
      annotations: [{
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: 0.5,
        text: 'No data available',
        showarrow: false,
        font: { size: 14, color: colors.neutral[0] }
      }],
      margin: { t: 40, b: 80, l: 80, r: 80 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    });
    return;
  }

  const trace = {
    x: resources.map(r => r.name),
    y: resources.map(r => r.name),
    z: zValues,
    type: 'heatmap',
    colorscale: [[0, colors.gradients.water[1]], [0.5, '#ffffff'], [1, colors.gradients.water[0]]],
    hovertemplate: `%{x} vs %{y}<br>Correlation: %{z:.2f}<extra></extra>`
  };

  const layout = {
    title: 'Resource Correlation Matrix',
    xaxis: { title: 'Resources' },
    yaxis: { title: 'Resources' },
    margin: { t: 40, b: 80, l: 80, r: 80 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };

  Plotly.newPlot('heatmap', [trace], layout, { displayModeBar: false, displaylogo: false });
}

function showTooltip(event, content) {
  const tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  }
  d3.select(".tooltip")
    .html(content)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px")
    .transition()
    .duration(200)
    .style("opacity", 1);
}

function hideTooltip() {
  d3.select(".tooltip")
    .transition()
    .duration(200)
    .style("opacity", 0);
}

loadData();
