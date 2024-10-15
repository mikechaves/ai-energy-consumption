// js/ai_energy_consumption_prototype.js

window.onload = function() {
  // Reference to the loading spinner (Optional)
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Show the spinner before data is loaded
  if (loadingSpinner) {
      loadingSpinner.style.display = 'flex';
  }

  // Fetch data from the JSON file
  fetch('ai_energy_consumption_data.json')
      .then(response => response.json())
      .then(data => {
          // Initialize the visualization with the fetched data
          initVisualization(data);
      })
      .catch(error => {
          console.error('Error fetching data:', error);
          // Hide the spinner if there's an error
          if (loadingSpinner) {
              loadingSpinner.style.display = 'none';
          }
      });

  /**
   * Initializes the A-Frame visualization with the provided data.
   * @param {Array} data - The array of country data objects.
   */
  function initVisualization(data) {
      // References to DOM elements
      const scene = document.querySelector('a-scene');
      const globe = document.getElementById('globe');
      const cameraRig = document.getElementById('cameraRig');
      const tooltip = document.getElementById('tooltip');
      const dataTypeSelect = document.getElementById('dataTypeSelect');
      const regionSelect = document.getElementById('regionSelect');
      const countrySearch = document.getElementById('countrySearch');
      const dataRange = document.getElementById('dataRange');
      const dataRangeValue = document.getElementById('dataRangeValue');
      const zoomInBtn = document.getElementById('zoomInBtn');
      const zoomOutBtn = document.getElementById('zoomOutBtn');
      const resetViewBtn = document.getElementById('resetViewBtn');
      const instructionOverlay = document.getElementById('instructionOverlay');
      const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
      const infoModal = document.getElementById('infoModal');
      const closeModal = document.getElementById('closeModal');
      const modalCountryName = document.getElementById('modalCountryName');
      const modalEnergyConsumed = document.getElementById('modalEnergyConsumed');
      const modalCO2Emissions = document.getElementById('modalCO2Emissions');
      const modalPopulation = document.getElementById('modalPopulation');
      const historicalChartCtx = document.getElementById('historicalChart').getContext('2d');
      const activeFiltersList = document.getElementById('filtersList');
      const successMessage = document.getElementById('successMessage');

      let historicalChart; // To store the Chart.js instance
      const THREE = AFRAME.THREE;

      // Current filter states
      let currentDataType = dataTypeSelect.value;
      let currentRegion = regionSelect.value;
      let searchTerm = countrySearch.value.toLowerCase();
      let rangePercentage = parseInt(dataRange.value) / 100; // Convert to decimal
      let maxValue = d3.max(data, d => d[currentDataType]) || 1; // Prevent undefined
      let colorScale = d3.scaleSequential(d3.interpolatePlasma)
          .domain([0, maxValue]);

      let filteredData = [];
      let barsGroup;
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      let currentMousePosition = { x: 0, y: 0 }; // To track mouse position for tooltip

      /**
       * Updates the maximum value based on the selected data type.
       */
      function updateMaxValue() {
          maxValue = d3.max(data, d => d[currentDataType]) || 1; // Prevent division by zero
          // Update color scale domain
          colorScale.domain([0, maxValue]);
          console.log(`Updated maxValue for ${currentDataType}: ${maxValue}`);
      }

      /**
       * Initializes event listeners for UI controls and interactions.
       */
      function setupEventListeners() {
          // Close instruction overlay
          closeInstructionsBtn.addEventListener('click', () => {
              instructionOverlay.style.display = 'none';
          });

          // Close info modal
          closeModal.addEventListener('click', () => {
              closeInfoModal();
          });

          // Close the modal when clicking outside the modal content
          window.addEventListener('click', function(event) {
              if (event.target == infoModal) {
                  closeInfoModal();
              }
          });

          // Data Type Selector
          dataTypeSelect.addEventListener('change', () => {
              currentDataType = dataTypeSelect.value;
              updateMaxValue();
              // Reset range slider to 100%
              dataRange.value = 100;
              rangePercentage = 1;
              dataRangeValue.innerText = `100% (${Math.round(maxValue).toLocaleString()})`;
              showSuccessMessage('Data type changed successfully!');
              updateVisualization();
          });

          // Region Selector
          regionSelect.addEventListener('change', () => {
              currentRegion = regionSelect.value;
              showSuccessMessage('Region filter applied successfully!');
              updateVisualization();
          });

          // Country Search with Autocomplete (Debounced)
          const debouncedCountrySearch = debounce(() => {
              searchTerm = countrySearch.value.toLowerCase();
              showSuccessMessage('Country search updated successfully!');
              updateVisualization();
          }, 300);

          countrySearch.addEventListener('input', debouncedCountrySearch);

          // Initialize Awesomplete for Country Search
          initializeAutocomplete(data);

          // Range Slider
          dataRange.addEventListener('input', () => {
              let newRangePercentage = parseInt(dataRange.value) / 100;
              // Prevent rangePercentage from being zero
              if (newRangePercentage === 0) {
                  rangePercentage = 0.01; // Set to 1% minimum
                  dataRange.value = 1;
              } else {
                  rangePercentage = newRangePercentage;
              }
              const rangeMaxValue = maxValue * rangePercentage;
              dataRangeValue.innerText = `${dataRange.value}% (${Math.round(rangeMaxValue).toLocaleString()})`;
              showSuccessMessage('Value filter updated successfully!');
              updateVisualization();
          });

          // Zoom In Button
          zoomInBtn.addEventListener('click', () => {
              zoomCamera(-1);
          });

          // Zoom Out Button
          zoomOutBtn.addEventListener('click', () => {
              zoomCamera(1);
          });

          // Reset View Button
          resetViewBtn.addEventListener('click', () => {
              globe.setAttribute('rotation', '0 0 0');
              cameraRig.setAttribute('position', '0 0 10');
              cameraRig.setAttribute('rotation', '0 0 0');

              // Reset camera look controls
              const camera = cameraRig.querySelector('[camera]');
              const lookControls = camera.components['look-controls'];
              if (lookControls) {
                  lookControls.pitchObject.rotation.x = 0;
                  lookControls.yawObject.rotation.y = 0;
              }

              // Reset range slider to 100%
              dataRange.value = 100;
              rangePercentage = 1;
              dataRangeValue.innerText = `100% (${Math.round(maxValue).toLocaleString()})`;
              showSuccessMessage('View reset successfully!');
              updateVisualization();
          });

          // Mouse Events for Globe Rotation (Optional: Already handled by A-Frame controls)
          // Not needed unless implementing custom rotation

          // Touch Events for Globe Rotation (Optional: Already handled by A-Frame controls)
          // Not needed unless implementing custom rotation

          // Track mouse movement for tooltip positioning
          window.addEventListener('mousemove', (event) => {
              currentMousePosition = { x: event.clientX, y: event.clientY };
          });

          // Handle A-Frame cursor events for tooltips
          const cursor = document.getElementById('cursor');
          if (cursor) {
              cursor.addEventListener('mouseenter', function(event) {
                  const target = event.target;
                  if (target.classList.contains('data-bar')) {
                      const data = target.getAttribute('data-info');
                      showTooltipAtPosition(data, currentMousePosition.x, currentMousePosition.y);
                  }
              });

              cursor.addEventListener('mouseleave', function(event) {
                  const target = event.target;
                  if (target.classList.contains('data-bar')) {
                      hideTooltip();
                  }
              });

              cursor.addEventListener('click', function(event) {
                  const target = event.target;
                  if (target.classList.contains('data-bar')) {
                      const data = target.getAttribute('data-info');
                      openInfoModal(JSON.parse(data));
                  }
              });
          }
      }

      /**
       * Initializes Awesomplete for the country search input.
       * @param {Array} data - The array of country data objects.
       */
      function initializeAutocomplete(data) {
          const countryNames = data.map(d => d.country);
          new Awesomplete(countrySearch, {
              list: countryNames,
              minChars: 1,
              maxItems: 10,
              autoFirst: true
          });
      }

      /**
       * Updates the active filters display.
       */
      function updateActiveFilters() {
          if (!activeFiltersList) return; // Exit if the element doesn't exist

          activeFiltersList.innerHTML = ''; // Clear existing filters

          // Data Type Filter
          if (currentDataType) {
              const li = document.createElement('li');
              li.innerText = `Data Type: ${formatDataType(currentDataType)}`;
              activeFiltersList.appendChild(li);
          }

          // Region Filter
          if (currentRegion && currentRegion !== 'All') {
              const li = document.createElement('li');
              li.innerText = `Region: ${currentRegion}`;
              activeFiltersList.appendChild(li);
          }

          // Country Search Filter
          if (searchTerm) {
              const matchedCountry = data.find(d => d.country.toLowerCase() === searchTerm);
              if (matchedCountry) {
                  const li = document.createElement('li');
                  li.innerText = `Country: ${matchedCountry.country}`;
                  activeFiltersList.appendChild(li);
              }
          }

          // Range Filter
          const rangeMaxValue = maxValue * rangePercentage;
          const liRange = document.createElement('li');
          liRange.innerText = `Value ≤ ${Math.round(rangeMaxValue).toLocaleString()}`;
          activeFiltersList.appendChild(liRange);
      }

      /**
       * Formats the data type string for display.
       * @param {string} dataType - The data type key.
       * @returns {string} - The formatted data type.
       */
      function formatDataType(dataType) {
          switch(dataType) {
              case 'energyConsumed':
                  return 'Energy Consumption';
              case 'co2Emissions':
                  return 'CO₂ Emissions';
              case 'energyPerCapita':
                  return 'Energy Consumption per Capita';
              case 'co2PerCapita':
                  return 'CO₂ Emissions per Capita';
              default:
                  return dataType;
          }
      }

      /**
       * Capitalizes the first letter of a string.
       * @param {string} string - The string to capitalize.
       * @returns {string} - The capitalized string.
       */
      function capitalizeFirstLetter(string) {
          return string.charAt(0).toUpperCase() + string.slice(1);
      }

      /**
       * Shows a success message to the user.
       * @param {string} message - The message to display.
       */
      function showSuccessMessage(message) {
          if (!successMessage) return;

          successMessage.innerText = message;
          successMessage.style.display = 'block';

          // Hide after 3 seconds
          setTimeout(() => {
              successMessage.style.display = 'none';
          }, 3000);
      }

      /**
       * Updates the visualization based on current filters.
       */
      function updateVisualization() {
          // Reference to the globe entity
          const globe = document.getElementById('globe');
          // Reference to the data range slider and its display
          const dataRange = document.getElementById('dataRange');
          const dataRangeValue = document.getElementById('dataRangeValue');

          // Reference to the data type selector
          const dataTypeSelect = document.getElementById('dataTypeSelect');
          const currentDataType = dataTypeSelect.value;

          // Reference to the region selector
          const regionSelect = document.getElementById('regionSelect');
          const currentRegion = regionSelect.value;

          // Reference to the country search input
          const countrySearch = document.getElementById('countrySearch');
          const searchTerm = countrySearch.value.toLowerCase();

          // Get current range percentage and calculate rangeMaxValue
          let rangePercentage = parseInt(dataRange.value) / 100;
          if (rangePercentage === 0) {
              rangePercentage = 0.01; // Prevent rangeMaxValue from being zero
              dataRange.value = 1;
          }
          const rangeMaxValue = maxValue * rangePercentage;
          dataRangeValue.innerText = `${dataRange.value}% (${Math.round(rangeMaxValue).toLocaleString()})`;
          console.log(`Range Slider: ${dataRange.value}% (${rangeMaxValue})`);

          // Filter data based on all active filters
          filteredData = data.filter(d => {
              const regionMatch = currentRegion === 'All' || d.region === currentRegion;
              const searchMatch = !searchTerm || d.country.toLowerCase().includes(searchTerm);
              const rangeMatch = d[currentDataType] <= rangeMaxValue;
              const validCoordinates = d.latitude != null && d.longitude != null;
              const validValue = d[currentDataType] != null && !isNaN(d[currentDataType]);
              return regionMatch && searchMatch && rangeMatch && validCoordinates && validValue;
          });

          console.log(`Filtered Data Count: ${filteredData.length}`);

          // Recalculate displayMaxValue based on the filtered data
          const displayMaxValue = d3.max(filteredData, d => d[currentDataType]) || 1; // Prevent division by zero
          console.log(`Display Max Value: ${displayMaxValue}`);

          // Update the color scale domain
          const updatedColorScale = d3.scaleSequential(d3.interpolatePlasma)
              .domain([0, displayMaxValue]);

          // Remove existing bars group if it exists
          let existingBarsGroup = globe.querySelector('.bars-group');
          if (existingBarsGroup) {
              globe.removeChild(existingBarsGroup);
          }

          // Create a new bars group
          barsGroup = document.createElement('a-entity');
          barsGroup.setAttribute('class', 'bars-group');
          globe.appendChild(barsGroup);

          // Create bars for each filtered data point
          filteredData.forEach(d => {
              const lat = d.latitude;
              const lon = d.longitude;
              const value = d[currentDataType];
              const barHeight = (value / displayMaxValue) * 2 + 0.1; // Scale height
              const barColor = updatedColorScale(value);

              // Convert lat/lon to Vector3 position
              const barPosition = latLongToVector3(lat, lon, 3); // Globe radius is 3

              // Create a cylinder to represent the data bar
              const bar = document.createElement('a-cylinder');
              bar.setAttribute('radius', 0.05);
              bar.setAttribute('height', barHeight);
              bar.setAttribute('color', barColor);
              bar.setAttribute('class', 'data-bar');
              bar.setAttribute('data-info', JSON.stringify(d)); // Store data in attribute for event handling

              // Compute quaternion rotation to align the bar perpendicular to the globe's surface
              const quaternion = computeBarRotation(barPosition);

              // Apply the quaternion rotation
              bar.object3D.quaternion.copy(quaternion);

              // Adjust position to extend from the globe's surface
              const barHeightOffset = barHeight / 2; // Half the bar's height
              const finalPosition = barPosition.clone().add(barPosition.clone().normalize().multiplyScalar(barHeightOffset));

              // Set the bar's position
              bar.object3D.position.copy(finalPosition);

              // Append the bar to the bars group
              barsGroup.appendChild(bar);
          });

          // Update the legend based on the current data
          updateLegend(displayMaxValue, updatedColorScale);

          // Update active filters display
          updateActiveFilters();
      }

      /**
       * Zooms the camera in or out based on the direction.
       * @param {number} direction - -1 for zooming in, 1 for zooming out.
       */
      function zoomCamera(direction) {
          const cameraRig = document.getElementById('cameraRig');
          const currentPosition = cameraRig.getAttribute('position');
          let newZ = parseFloat(currentPosition.z) + direction * 1; // Adjust zoom speed here
          // Clamp the zoom to prevent excessive zooming
          newZ = Math.min(Math.max(newZ, 5), 20);
          cameraRig.setAttribute('position', `0 0 ${newZ}`);
          console.log(`Camera Zoomed ${direction === -1 ? 'In' : 'Out'} to Z: ${newZ}`);
      }

      /**
       * Converts latitude and longitude to an AFRAME.THREE.Vector3.
       * @param {number} lat - Latitude in degrees.
       * @param {number} lon - Longitude in degrees.
       * @param {number} radius - Radius of the globe.
       * @returns {THREE.Vector3} The 3D position vector.
       */
      function latLongToVector3(lat, lon, radius) {
          const phi = (90 - lat) * (Math.PI / 180);
          const theta = (lon + 180) * (Math.PI / 180);

          const x = -radius * Math.sin(phi) * Math.cos(theta);
          const z = radius * Math.sin(phi) * Math.sin(theta);
          const y = radius * Math.cos(phi);

          return new THREE.Vector3(x, y, z);
      }

      /**
       * Computes the quaternion rotation needed to align the bar perpendicular to the globe's surface.
       * @param {THREE.Vector3} vector - The position vector of the bar.
       * @returns {THREE.Quaternion} The quaternion representing the rotation.
       */
      function computeBarRotation(vector) {
          const up = new THREE.Vector3(0, 1, 0);
          const normalizedVector = vector.clone().normalize();
          const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normalizedVector);
          return quaternion;
      }

      /**
       * Displays the tooltip with detailed information about the data bar at a specific position.
       * @param {Object} data - The data object associated with the bar.
       * @param {number} x - The x-coordinate for the tooltip position.
       * @param {number} y - The y-coordinate for the tooltip position.
       */
      function showTooltipAtPosition(data, x, y) {
          if (!tooltip) return;

          const dataTypeLabels = {
              'energyConsumed': 'Energy Consumed',
              'co2Emissions': 'CO₂ Emissions',
              'energyPerCapita': 'Energy Consumption per Capita',
              'co2PerCapita': 'CO₂ Emissions per Capita'
          };

          const perCapitaDataTypes = {
              'energyConsumed': 'energyPerCapita',
              'co2Emissions': 'co2PerCapita'
          };

          // Determine if current data type is per capita
          const isPerCapita = currentDataType.endsWith('PerCapita');

          // Prepare per capita value if applicable
          let perCapitaText = '';
          if (!isPerCapita && perCapitaDataTypes[currentDataType]) {
              const perCapitaValue = data[perCapitaDataTypes[currentDataType]];
              if (perCapitaValue != null) {
                  perCapitaText = `Per Capita: ${perCapitaValue.toLocaleString()}<br/>`;
              }
          }

          // Build the tooltip content
          tooltip.innerHTML = `
              <strong>${data.country}</strong><br/>
              ${dataTypeLabels[currentDataType]}: ${data[currentDataType] != null ? data[currentDataType].toLocaleString() : 'N/A'}<br/>
              Population: ${data.population != null ? data.population.toLocaleString() : 'N/A'}<br/>
              ${perCapitaText}
          `;

          // Position the tooltip
          tooltip.style.left = `${x + 15}px`;
          tooltip.style.top = `${y + 15}px`;
          tooltip.style.display = 'block';
      }

      /**
       * Hides the tooltip.
       */
      function hideTooltip() {
          if (!tooltip) return;
          tooltip.style.display = 'none';
      }

      /**
       * Opens the information modal and populates it with detailed data.
       * @param {Object} data - The data object associated with the clicked bar.
       */
      function openInfoModal(data) {
          // Populate modal with data
          modalCountryName.innerText = data.country;
          modalEnergyConsumed.innerText = data.energyConsumed != null ? data.energyConsumed.toLocaleString() : 'N/A';
          modalCO2Emissions.innerText = data.co2Emissions != null ? data.co2Emissions.toLocaleString() : 'N/A';
          modalPopulation.innerText = data.population != null ? data.population.toLocaleString() : 'N/A';

          // Example: Generate mock historical data
          const historicalData = generateMockHistoricalData(data);

          // Destroy previous chart instance if it exists
          if (historicalChart) {
              historicalChart.destroy();
          }

          // Create new chart
          historicalChart = new Chart(historicalChartCtx, {
              type: 'line',
              data: {
                  labels: historicalData.years,
                  datasets: [{
                      label: `${formatDataType(currentDataType)} Over Time`,
                      data: historicalData.values,
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      fill: true,
                      tension: 0.1
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          display: true
                      },
                      tooltip: {
                          mode: 'index',
                          intersect: false
                      }
                  },
                  interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false
                  },
                  scales: {
                      x: {
                          display: true,
                          title: {
                              display: true,
                              text: 'Year'
                          }
                      },
                      y: {
                          display: true,
                          title: {
                              display: true,
                              text: formatDataType(currentDataType)
                          }
                      }
                  }
              }
          });

          // Display the modal
          infoModal.style.display = 'block';

          // Trap focus inside the modal for accessibility
          trapFocus(infoModal);
      }

      /**
       * Generates mock historical data for demonstration purposes.
       * Replace this with actual historical data if available.
       * @param {Object} data - The data object for the selected country.
       * @returns {Object} An object containing years and corresponding values.
       */
      function generateMockHistoricalData(data) {
          const currentYear = new Date().getFullYear();
          const years = [];
          const values = [];
          for (let i = 10; i >= 1; i--) {
              years.push(currentYear - i);
              // Simulate some growth or decline
              const variation = data[currentDataType] * (0.8 + Math.random() * 0.4);
              values.push(Math.round(variation));
          }
          return { years, values };
      }

      /**
       * Closes the information modal.
       */
      function closeInfoModal() {
          infoModal.style.display = 'none';
      }

      /**
       * Updates the legend to reflect the current color scale.
       * @param {number} maxValue - The maximum value in the current data set.
       * @param {Function} colorScale - The D3 color scale function.
       */
      function updateLegend(maxValue, colorScale) {
          const canvas = document.getElementById('legendCanvas');
          if (!canvas) {
              console.error('Legend canvas not found!');
              return;
          }
          const context = canvas.getContext('2d');

          // Clear previous content
          context.clearRect(0, 0, canvas.width, canvas.height);

          // Create gradient
          const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
          const steps = 100;
          for (let i = 0; i <= steps; i++) {
              const value = (i / steps) * maxValue;
              gradient.addColorStop(i / steps, colorScale(value));
          }

          // Fill rectangle with gradient
          context.fillStyle = gradient;
          context.fillRect(0, 0, canvas.width, 20);

          // Add text labels
          context.fillStyle = '#000';
          context.font = '12px Arial';
          context.textAlign = 'left';
          context.fillText(`0`, 0, 35);
          context.textAlign = 'right';
          context.fillText(`${Math.round(maxValue).toLocaleString()}`, canvas.width, 35);
      }

      /**
       * Initializes the visualization by setting up event listeners and rendering the initial data.
       */
      function initialize() {
          setupEventListeners();
          updateVisualization();

          // Hide the loading spinner after initialization (Optional)
          if (loadingSpinner) {
              loadingSpinner.style.display = 'none';
          }

          // Event listener for closing the modal
          closeModal.addEventListener('click', closeInfoModal);

          // Close the modal when clicking outside the modal content
          window.addEventListener('click', function(event) {
              if (event.target == infoModal) {
                  closeInfoModal();
              }
          });
      }

      /**
       * Initializes the visualization by setting up event listeners and rendering the initial data.
       */
      initialize();
  }

  /**
   * Debounce function to limit the rate at which a function can fire.
   * @param {Function} func - The function to debounce.
   * @param {number} delay - The delay in milliseconds.
   * @returns {Function} - The debounced function.
   */
  function debounce(func, delay) {
      let debounceTimer;
      return function() {
          const context = this;
          const args = arguments;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => func.apply(context, args), delay);
      }
  }

  /**
   * Traps focus inside a modal for accessibility.
   * @param {HTMLElement} modal - The modal element.
   */
  function trapFocus(modal) {
      const focusableElements = modal.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      modal.addEventListener('keydown', function(e) {
          const isTabPressed = (e.key === 'Tab' || e.keyCode === 9);

          if (!isTabPressed) {
              return;
          }

          if (e.shiftKey) { // Shift + Tab
              if (document.activeElement === firstElement) {
                  lastElement.focus();
                  e.preventDefault();
              }
          } else { // Tab
              if (document.activeElement === lastElement) {
                  firstElement.focus();
                  e.preventDefault();
              }
          }
      });

      // Focus the first element in the modal
      firstElement.focus();
  }
};