// AI Energy Consumption Visualization using D3.js and A-Frame

// Fetch data from the JSON file and initialize the visualization
fetch('ai_energy_consumption_data.json')
  .then(response => response.json())
  .then(data => {
    // Initialize the visualization with the fetched data
    initVisualization(data);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });

function initVisualization(data) {
  // Global variables for data and state management
  let currentDataType = 'energyConsumed'; // 'energyConsumed' or 'co2Emissions'
  let currentRegion = 'All'; // Region filter
  let countryData = data; // Original data
  let filteredData = data; // Data after applying filters

  // Select DOM elements for the scene and controls
  const scene = document.querySelector('a-scene');
  const globe = document.getElementById('globe');
  const tooltip = document.getElementById('tooltip');
  const dataTypeSelect = document.getElementById('dataTypeSelect');
  const regionSelect = document.getElementById('regionSelect');

  // Define globe parameters
  const globeRadius = 3;
  const globeCenter = new AFRAME.THREE.Vector3(0, 2, -10); // Use AFRAME.THREE.Vector3

  // Variables for globe rotation
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  // Declare legend elements
  let legend, legendCanvas, legendContext, texture, minLabel, maxLabel, legendTitle;

  // Add event listeners for UI controls
  dataTypeSelect.addEventListener('change', function() {
    currentDataType = this.value;
    updateVisualization();
  });

  regionSelect.addEventListener('change', function() {
    currentRegion = this.value;
    updateVisualization();
  });

  // Add event listeners for mouse dragging to rotate the globe
  scene.addEventListener('mousedown', function(event) {
    isDragging = true;
    previousMousePosition = {
      x: event.screenX,
      y: event.screenY
    };
  });

  scene.addEventListener('mousemove', function(event) {
    if (isDragging) {
      const deltaX = event.screenX - previousMousePosition.x;
      const deltaY = event.screenY - previousMousePosition.y;

      const rotation = globe.getAttribute('rotation');
      rotation.y += deltaX * 0.1; // Adjust sensitivity as needed
      rotation.x -= deltaY * 0.1;

      // Limit the x rotation to prevent flipping
      rotation.x = Math.max(-90, Math.min(90, rotation.x));

      globe.setAttribute('rotation', rotation);

      previousMousePosition = {
        x: event.screenX,
        y: event.screenY
      };
    }
  });

  scene.addEventListener('mouseup', function() {
    isDragging = false;
  });

  scene.addEventListener('mouseleave', function() {
    isDragging = false;
  });

  // Update the tooltip position based on mouse movement over the scene
  scene.addEventListener('mousemove', (event) => {
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
  });

  // Create the legend elements
  // Create a plane for the legend background
  legend = document.createElement('a-plane');
  legend.setAttribute('position', '0 0.5 -4');
  legend.setAttribute('width', '2');
  legend.setAttribute('height', '0.2');
  legend.setAttribute('material', 'shader: flat; side: double; opacity: 0.8');
  scene.appendChild(legend);

  // Create a canvas to draw the color gradient
  legendCanvas = document.createElement('canvas');
  legendCanvas.width = 256;
  legendCanvas.height = 32;
  legendContext = legendCanvas.getContext('2d');

  // Create a texture from the canvas
  texture = new AFRAME.THREE.CanvasTexture(legendCanvas);

  // Wait for the legend entity to be fully loaded
  legend.addEventListener('loaded', function () {
    // Access the mesh material and set the texture
    const mesh = legend.getObject3D('mesh');
    if (mesh) {
      mesh.material.map = texture;
      mesh.material.needsUpdate = true;
    }
  });

  // Add labels to the legend
  minLabel = document.createElement('a-text');
  minLabel.setAttribute('value', '');
  minLabel.setAttribute('position', '-1 0.7 -4');
  minLabel.setAttribute('align', 'left');
  minLabel.setAttribute('color', '#000000');
  minLabel.setAttribute('width', 2);
  scene.appendChild(minLabel);

  maxLabel = document.createElement('a-text');
  maxLabel.setAttribute('value', '');
  maxLabel.setAttribute('position', '1 0.7 -4');
  maxLabel.setAttribute('align', 'right');
  maxLabel.setAttribute('color', '#000000');
  maxLabel.setAttribute('width', 2);
  scene.appendChild(maxLabel);

  // Add a title to the legend
  legendTitle = document.createElement('a-text');
  legendTitle.setAttribute('value', '');
  legendTitle.setAttribute('position', '0 0.9 -4');
  legendTitle.setAttribute('align', 'center');
  legendTitle.setAttribute('color', '#000000');
  legendTitle.setAttribute('width', 4);
  scene.appendChild(legendTitle);

  // Initialize the visualization
  updateVisualization();

  function updateVisualization() {
    // Filter data based on selected region
    if (currentRegion === 'All') {
      filteredData = countryData;
    } else {
      filteredData = countryData.filter(d => d.region === currentRegion);
    }

    // Remove existing bars before re-rendering
    const existingBars = document.querySelectorAll('.data-bar');
    existingBars.forEach(bar => bar.parentNode.removeChild(bar));

    // Create a color scale using D3's interpolateViridis for smoother gradients
    const maxValue = d3.max(filteredData, d => d[currentDataType]);
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, maxValue]);

    // Update the legend gradient
    const legendGradient = legendContext.createLinearGradient(0, 0, legendCanvas.width, 0);

    for (let i = 0; i <= 1; i += 0.01) {
      legendGradient.addColorStop(i, colorScale(i * maxValue));
    }

    legendContext.fillStyle = legendGradient;
    legendContext.fillRect(0, 0, legendCanvas.width, legendCanvas.height);
    texture.needsUpdate = true;

    // Update the legend labels with actual data values
    const minDataValue = d3.min(filteredData, d => d[currentDataType]);
    const maxDataValue = d3.max(filteredData, d => d[currentDataType]);

    minLabel.setAttribute('value', 'Low: ' + minDataValue.toLocaleString());
    maxLabel.setAttribute('value', 'High: ' + maxDataValue.toLocaleString());
    legendTitle.setAttribute('value', currentDataType === 'energyConsumed' ? 'Energy Consumption (kWh)' : 'CO₂ Emissions (tons)');

    // Loop through each data point and create visualization elements
    filteredData.forEach(d => {
      // Convert latitude and longitude to 3D coordinates
      const coords = latLongToVector3(d.latitude, d.longitude, globeRadius);

      // Calculate bar height based on data value
      const barHeight = (d[currentDataType] / maxValue) * 2; // Scale bar height

      // Position the bar on the globe's surface
      const barPosition = coords.clone().multiplyScalar((globeRadius + barHeight / 2) / globeRadius);

      // Create a cylinder entity to represent the data bar
      const bar = document.createElement('a-cylinder');
      bar.setAttribute('class', 'data-bar');
      bar.setAttribute('radius', 0.05);
      bar.setAttribute('height', barHeight);
      bar.setAttribute('segments-radial', 6); // Reduce segments for performance
      bar.setAttribute('position', barPosition.add(globeCenter).toArray().join(' '));
      bar.setAttribute('rotation', computeBarRotation(coords).toArray().map(radToDeg).join(' '));
      bar.setAttribute('color', colorScale(d[currentDataType]));

      // Add event listeners for interactive tooltip
      bar.addEventListener('raycaster-intersected', (event) => {
        showTooltip(event, d);
      });
      bar.addEventListener('raycaster-intersected-cleared', hideTooltip);

      // Append the bar to the globe entity
      globe.appendChild(bar);
    });
  }

  // The rest of your helper functions remain unchanged

  /**
   * Converts latitude and longitude to an AFRAME.THREE.Vector3.
   */
  function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new AFRAME.THREE.Vector3(x, y, z);
  }

  /**
   * Computes the rotation needed to align the bar perpendicular to the globe's surface.
   */
  function computeBarRotation(vector) {
    const up = new AFRAME.THREE.Vector3(0, 1, 0);
    const axis = new AFRAME.THREE.Vector3().crossVectors(up, vector).normalize();
    const angle = Math.acos(up.clone().dot(vector.clone().normalize()));
    const quaternion = new AFRAME.THREE.Quaternion().setFromAxisAngle(axis, angle);
    const euler = new AFRAME.THREE.Euler().setFromQuaternion(quaternion, 'YXZ');

    return euler;
  }

  /**
   * Converts radians to degrees.
   */
  function radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Displays the tooltip with the data details at the cursor's position.
   */
  function showTooltip(event, data) {
    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <strong>${data.country}</strong><br/>
      ${currentDataType === 'energyConsumed' ? 'Energy Consumed' : 'CO₂ Emissions'}: ${data[currentDataType]}
    `;
  }

  /**
   * Hides the tooltip.
   */
  function hideTooltip() {
    tooltip.style.display = 'none';
  }
}