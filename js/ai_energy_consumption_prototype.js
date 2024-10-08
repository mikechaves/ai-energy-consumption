// AI Energy Consumption Visualization using D3.js and A-Frame

// Function to create the A-Frame scene and add data-driven visualization
function createVisualization(aiEnergyConsumption) {
  console.log('Initializing A-Frame scene for AI energy consumption visualization...');

  // Function to append A-Frame scene if not already appended
  function appendScene() {
    if (!document.querySelector('a-scene')) { // Check if the scene is already appended to avoid duplicates
      const scene = document.createElement('a-scene');
      document.body.appendChild(scene);
      console.log('A-Frame scene appended to body.');
      return scene;
    } else {
      console.log('A-Frame scene already exists in the document. Skipping append.');
      return document.querySelector('a-scene');
    }
  }

  // Append or select the scene
  const scene = appendScene();

  // Add a sky element for background
  const sky = document.createElement('a-sky');
  sky.setAttribute('color', '#c8f7f0'); // Light blue sky
  scene.appendChild(sky);
  console.log('Sky element added to scene.');

  // Add a sphere element for the globe
  const globe = document.createElement('a-sphere');
  globe.setAttribute('radius', 3);
  globe.setAttribute('color', '#6b93d6'); // Blue color for the globe
  globe.setAttribute('position', '0 2 -10'); // Adjust position to make it visible
  globe.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 20000; easing: linear'); // Animate rotation of the globe
  scene.appendChild(globe);
  console.log('Globe element added to scene.');

  // Add a label for the globe
  const globeLabel = document.createElement('a-text');
  globeLabel.setAttribute('value', 'Global AI Energy Consumption');
  globeLabel.setAttribute('position', '0 5 -10'); // Position above the globe
  globeLabel.setAttribute('color', '#000000'); // Black color for text visibility
  globeLabel.setAttribute('width', 5); // Set text width for readability
  scene.appendChild(globeLabel);
  console.log('Globe label added to scene.');

  // Function to convert latitude and longitude to 3D coordinates on a sphere
  function latLongToCartesian(lat, lon, radius) {
    console.log(`Converting latitude: ${lat}, longitude: ${lon} to Cartesian coordinates...`);
    const phi = (90 - lat) * (Math.PI / 180); // Convert latitude to radians and adjust for spherical coordinates
    const theta = (lon + 180) * (Math.PI / 180); // Convert longitude to radians and adjust for spherical coordinates
    const x = -(radius * Math.sin(phi) * Math.cos(theta)); // Calculate x coordinate
    const z = radius * Math.sin(phi) * Math.sin(theta); // Calculate z coordinate
    const y = radius * Math.cos(phi); // Calculate y coordinate
    console.log(`Converted to Cartesian coordinates: x=${x}, y=${y}, z=${z}`);
    return { x, y, z }; // Return the calculated Cartesian coordinates
  }

  // Define globe's center and radius
  const globeCenter = { x: 0, y: 2, z: -10 }; // Globe's center position in the scene
  const globeRadius = 3; // Globe's radius

  // Pre-calculate positions for all data points to improve performance
  const energyConsumptionPositions = aiEnergyConsumption.map((d) => { // Renamed variable for better clarity
    const position = latLongToCartesian(d.latitude, d.longitude, globeRadius);
    return {
      ...d,
      position,
      barHeight: d.energyConsumed / 2000000, // Scale the energy consumption value to determine the bar height
    };
  });

  // Create a DocumentFragment to batch DOM manipulations
  const fragment = document.createDocumentFragment();

  // Loop through each data point to create visualization elements
  energyConsumptionPositions.forEach((d) => {
    console.log(`Adding visualization for ${d.country}...`);

    // Adjust position to align with the globe's actual position
    const adjustedPosition = {
      x: globeCenter.x + d.position.x, // Adjust x coordinate relative to globe center
      y: globeCenter.y + d.position.y + (d.barHeight / 2), // Adjust y coordinate and add half of bar height to start from the surface
      z: globeCenter.z + d.position.z // Adjust z coordinate relative to globe center
    };

    console.log(`Adjusted position for ${d.country}: x=${adjustedPosition.x}, y=${adjustedPosition.y}, z=${adjustedPosition.z}`);

    // Create a color gradient based on energy consumption for better visualization
    const colorScale = d3.scaleLinear()
      .domain([0, d3.max(aiEnergyConsumption, d => d.energyConsumed)])
      .range(['#00ff00', '#ff0000']); // Green to red gradient based on energy consumption

    const cylinderColor = colorScale(d.energyConsumed);

    // Create a cylinder element to represent energy consumption
    const energyCylinder = document.createElement('a-cylinder');
    energyCylinder.setAttribute('position', `${adjustedPosition.x} ${adjustedPosition.y} ${adjustedPosition.z}`); // Set the position of the cylinder
    energyCylinder.setAttribute('radius', 0.15); // Fixed radius for the cylinder to make it more visible
    energyCylinder.setAttribute('height', 0.1); // Start with a minimal height for animation
    energyCylinder.setAttribute('color', cylinderColor); // Set the color based on energy consumption value
    energyCylinder.setAttribute('class', 'interactive-cylinder'); // Add a class for interaction purposes
    energyCylinder.setAttribute('animation__grow', `property: height; to: ${d.barHeight}; dur: 2000; easing: easeOutElastic;`); // Animate cylinder growth
    console.log(`Setting position for ${d.country}: x=${adjustedPosition.x}, y=${adjustedPosition.y}, z=${adjustedPosition.z}`);
    console.log(`Setting height for ${d.country}: height=${d.barHeight}`);
    console.log(`Setting color for ${d.country}: color=${cylinderColor}`);

    // Add the cylinder element to the fragment
    fragment.appendChild(energyCylinder);

    // Add a label for each cylinder with more detailed information
    const cylinderLabel = document.createElement('a-text');
    cylinderLabel.setAttribute('value', `${d.country}\nEnergy: ${d.energyConsumed} kWh\nCO2: ${d.co2Emissions} tons`);
    cylinderLabel.setAttribute('position', `${adjustedPosition.x} ${adjustedPosition.y + d.barHeight + 0.5} ${adjustedPosition.z}`); // Position above the cylinder
    cylinderLabel.setAttribute('color', '#000000'); // Black color for text visibility
    cylinderLabel.setAttribute('width', 3); // Set text width for readability
    cylinderLabel.setAttribute('align', 'center'); // Center align the text for better clarity
    fragment.appendChild(cylinderLabel);

    // Add event listener for interaction
    energyCylinder.addEventListener('click', () => {
      console.log(`Cylinder for ${d.country} clicked.`);
      // Create a static label for interaction rather than a floating tooltip
      const existingInfo = document.querySelector('.info-text');
      if (existingInfo) {
        scene.removeChild(existingInfo);
      }
      const infoText = document.createElement('a-text');
      infoText.setAttribute('value', `Country: ${d.country}\nEnergy Consumed: ${d.energyConsumed}\nCO2 Emissions: ${d.co2Emissions}`);
      infoText.setAttribute('position', '0 4 -10'); // Position at the top center for better visibility
      infoText.setAttribute('color', '#000000'); // Black color for text visibility
      infoText.setAttribute('width', 4); // Set text width for readability
      infoText.setAttribute('class', 'info-text');
      scene.appendChild(infoText);
    });

    // Add hover effect to highlight the cylinder
    energyCylinder.addEventListener('mouseenter', () => {
      console.log(`Mouse entered cylinder for ${d.country}.`);
      energyCylinder.setAttribute('color', '#ffff00'); // Change color to yellow when hovered over
    });

    energyCylinder.addEventListener('mouseleave', () => {
      console.log(`Mouse left cylinder for ${d.country}.`);
      energyCylinder.setAttribute('color', cylinderColor); // Revert color when not hovered over
    });
  });

  // Append the fragment to the scene
  scene.appendChild(fragment);
  console.log('All energy consumption cylinders added to the scene.');

  // Add a legend for color gradient
  const legend = document.createElement('a-plane');
  legend.setAttribute('position', '0 1 -5');
  legend.setAttribute('width', '4');
  legend.setAttribute('height', '1');
  legend.setAttribute('color', '#ffffff');
  scene.appendChild(legend);

  const legendText = document.createElement('a-text');
  legendText.setAttribute('value', 'Energy Consumption (Green: Low, Red: High)');
  legendText.setAttribute('position', '-1.8 0 0.1');
  legendText.setAttribute('color', '#000000');
  legendText.setAttribute('width', '3.5');
  legend.appendChild(legendText);

  // Add user-controlled zoom functionality
  const camera = document.createElement('a-entity');
  camera.setAttribute('camera', '');
  camera.setAttribute('position', '0 1.6 5'); // Set the initial position of the camera
  camera.setAttribute('look-controls', '');
  camera.setAttribute('wasd-controls', 'acceleration: 100'); // Allow for movement with high acceleration for zooming
  camera.setAttribute('touch-controls', 'enabled: true'); // Enable touch controls for mobile devices
  scene.appendChild(camera);
  console.log('Camera with zoom controls added to the scene.');

  // Add orbit controls to allow globe rotation by clicking and dragging
  const orbitControls = document.createElement('a-entity');
  orbitControls.setAttribute('orbit-controls', 'target: 0 2 -10; enabled: true; reverseMouseDrag: false; touchEnabled: true');
  scene.appendChild(orbitControls);
  console.log('Orbit controls added to the scene for globe interaction.');

  // Add a button to toggle between energy consumption and CO2 emissions
  const toggleButton = document.createElement('button');
  toggleButton.innerHTML = 'Toggle Data View';
  toggleButton.style.position = 'absolute';
  toggleButton.style.top = '10px';
  toggleButton.style.left = '10px';
  document.body.appendChild(toggleButton);
  let showingEnergy = true;
  toggleButton.addEventListener('click', () => {
    showingEnergy = !showingEnergy;
    console.log('Toggling data view. Showing energy:', showingEnergy);
    energyConsumptionPositions.forEach((d, index) => {
      const cylinder = scene.querySelectorAll('.interactive-cylinder')[index];
      const label = scene.querySelectorAll('a-text')[index + 1]; // Adjust index to account for the globe label
      if (showingEnergy) {
        cylinder.setAttribute('height', d.barHeight);
        label.setAttribute('value', `${d.country}\nEnergy: ${d.energyConsumed} kWh\nCO2: ${d.co2Emissions} tons`);
      } else {
        const co2Height = d.co2Emissions / 1000;
        cylinder.setAttribute('height', co2Height);
        label.setAttribute('value', `${d.country}\nCO2: ${d.co2Emissions} tons`);
      }
    });
  });
  console.log('Toggle button added for data view switching.');
}

// Fetch data from JSON file and create visualization
fetch('ai_energy_consumption_data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    createVisualization(data);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });