// js/ai_energy_consumption_prototype.js

window.onload = function() {
  // Fetch data from the updated JSON file
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
    const scene = document.querySelector('a-scene');
    const globe = document.getElementById('globe');
    const cameraRig = document.getElementById('cameraRig');
    const tooltip = document.getElementById('tooltip');
    const dataTypeSelect = document.getElementById('dataTypeSelect');
    const regionSelect = document.getElementById('regionSelect');
    const countrySearch = document.getElementById('countrySearch');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetViewBtn = document.getElementById('resetViewBtn');
    const instructionOverlay = document.getElementById('instructionOverlay');
    const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

    const THREE = AFRAME.THREE; // Ensure THREE is accessible

    let currentDataType = dataTypeSelect.value;
    let currentRegion = regionSelect.value;
    let filteredData = [];
    let barsGroup;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Close instruction overlay
    closeInstructionsBtn.addEventListener('click', () => {
      instructionOverlay.style.display = 'none';
    });

    // Event listeners for controls
    dataTypeSelect.addEventListener('change', () => {
      currentDataType = dataTypeSelect.value;
      updateVisualization();
    });

    regionSelect.addEventListener('change', () => {
      currentRegion = regionSelect.value;
      updateVisualization();
    });

    countrySearch.addEventListener('input', () => {
      updateVisualization();
    });

    zoomInBtn.addEventListener('click', () => {
      zoomCamera(-1);
    });

    zoomOutBtn.addEventListener('click', () => {
      zoomCamera(1);
    });

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
    });

    function zoomCamera(direction) {
      const position = cameraRig.getAttribute('position');
      position.z += direction * 1; // Adjust zoom speed
      cameraRig.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
    }

    // Initialize the visualization
    updateVisualization();

    function updateVisualization() {
      // Remove existing bars
      if (barsGroup) {
        globe.removeChild(barsGroup);
      }
      barsGroup = document.createElement('a-entity');
      globe.appendChild(barsGroup);

      // Filter data based on region and search term
      const searchTerm = countrySearch.value.toLowerCase();
      filteredData = data.filter(d => {
        const regionMatch = currentRegion === 'All' || d.region === currentRegion;
        const searchMatch = d.country.toLowerCase().includes(searchTerm);
        return regionMatch && searchMatch && d[currentDataType] != null;
      });

      const maxValue = d3.max(filteredData, d => d[currentDataType]);
      const colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain([0, maxValue]);

      // Create bars for each data point
      filteredData.forEach(d => {
        const lat = d.latitude;
        const lon = d.longitude;
        const value = d[currentDataType];
        const barHeight = (value / maxValue) * 2 + 0.1; // Scale height
        const barColor = colorScale(value);

        const barPosition = latLongToVector3(lat, lon, 3); // Radius of the globe

        const bar = document.createElement('a-cylinder');
        bar.setAttribute('radius', 0.05);
        bar.setAttribute('height', barHeight);
        bar.setAttribute('color', barColor);
        bar.setAttribute('class', 'data-bar');
        bar.setAttribute('data-country', d.country);

        // Compute rotation to align bar with globe surface
        const quaternion = computeBarRotation(barPosition);

        // Set bar rotation using quaternion for accurate alignment
        bar.object3D.quaternion.copy(quaternion);

        // Adjust position to extend from globe surface
        const barHeightOffset = barHeight / 2; // Half the bar's height
        const finalPosition = barPosition.clone().add(barPosition.clone().normalize().multiplyScalar(barHeightOffset));

        // Set bar position directly on object3D
        bar.object3D.position.copy(finalPosition);

        // Add event listeners for tooltip
        bar.addEventListener('mouseenter', (event) => {
          showTooltip(event, d);
        });
        bar.addEventListener('mouseleave', hideTooltip);

        barsGroup.appendChild(bar);
      });

      // Update legend
      updateLegend(maxValue, colorScale);
    }

    // Mouse interaction for globe rotation
    scene.addEventListener('mousedown', function(event) {
      isDragging = true;
      globe.removeAttribute('animation'); // Stop the rotation
      previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    scene.addEventListener('mouseup', function() {
      isDragging = false;
      // Resume rotation
      globe.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 60000; easing: linear;');
    });

    scene.addEventListener('mousemove', function(event) {
      if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        // Get current rotation
        let rotation = globe.getAttribute('rotation');
        rotation.x = parseFloat(rotation.x) || 0;
        rotation.y = parseFloat(rotation.y) || 0;
        rotation.z = parseFloat(rotation.z) || 0;

        // Update rotation based on mouse movement
        rotation.y += deltaX * 0.5;
        rotation.x += deltaY * 0.5;

        globe.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);

        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
      // Update tooltip position
      updateTooltipPosition(event);
    });

    // Touch interaction for mobile devices
    let touchStartX, touchStartY;

    scene.addEventListener('touchstart', function(event) {
      isDragging = true;
      globe.removeAttribute('animation');
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    });

    scene.addEventListener('touchmove', function(event) {
      if (isDragging) {
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;

        // Get current rotation
        let rotation = globe.getAttribute('rotation');
        rotation.x = parseFloat(rotation.x) || 0;
        rotation.y = parseFloat(rotation.y) || 0;
        rotation.z = parseFloat(rotation.z) || 0;

        // Update rotation based on touch movement
        rotation.y += deltaX * 0.5;
        rotation.x += deltaY * 0.5;

        globe.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      }
    });

    scene.addEventListener('touchend', function() {
      isDragging = false;
      globe.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 60000; easing: linear;');
    });

    /**
     * Converts latitude and longitude to an AFRAME.THREE.Vector3.
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
     * Computes the rotation needed to align the bar perpendicular to the globe's surface.
     */
    function computeBarRotation(vector) {
      const up = new THREE.Vector3(0, 1, 0);
      const normalizedVector = vector.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normalizedVector);
      return quaternion;
    }

    /**
     * Displays the tooltip with the data details at the cursor's position.
     */
    function showTooltip(event, data) {
      tooltip.style.display = 'block';

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
    }

    /**
     * Hides the tooltip.
     */
    function hideTooltip() {
      tooltip.style.display = 'none';
    }

    /**
     * Updates the tooltip position based on cursor movement.
     */
    function updateTooltipPosition(event) {
      const tooltipWidth = tooltip.offsetWidth;
      const tooltipHeight = tooltip.offsetHeight;
      const pageWidth = window.innerWidth;
      const pageHeight = window.innerHeight;
      let x = event.clientX + 15;
      let y = event.clientY + 15;
      if (x + tooltipWidth > pageWidth) {
        x = event.clientX - tooltipWidth - 15;
      }
      if (y + tooltipHeight > pageHeight) {
        y = event.clientY - tooltipHeight - 15;
      }
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }

    /**
     * Updates the legend to reflect the current color scale.
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
      context.fillText(`${maxValue.toLocaleString()}`, canvas.width, 35);
    }
  }
};