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

/**
 * Initializes the visualization with the given data.
 * @param {Array} data - The array of country data objects.
 */
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

  // Initialize the visualization
  updateVisualization();

  /**
   * Updates the visualization based on current filters and data type.
   */
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

  /**
   * Converts latitude and longitude to an AFRAME.THREE.Vector3.
   * @param {number} lat - The latitude in degrees.
   * @param {number} lon - The longitude in degrees.
   * @param {number} radius - The radius of the globe.
   * @returns {AFRAME.THREE.Vector3} The 3D coordinate on the globe's surface.
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
   * @param {AFRAME.THREE.Vector3} vector - The vector pointing from the globe's center to the surface point.
   * @returns {AFRAME.THREE.Euler} The rotation in Euler angles.
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
   * @param {number} radians - The angle in radians.
   * @returns {number} The angle in degrees.
   */
  function radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Displays the tooltip with the data details at the cursor's position.
   * @param {Event} event - The event object.
   * @param {Object} data - The data object for the hovered country.
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