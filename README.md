AI Energy Consumption Visualization

An interactive 3D data visualization showcasing the global impact of AI’s energy consumption and CO₂ emissions across different countries and regions. Built using A-Frame and D3.js, this project combines immersive 3D graphics with data storytelling to highlight the rising energy demands associated with AI technologies.

Table of Contents

	•	Demo
	•	Features
	•	Installation
	•	Usage
	•	Data
	•	Project Structure
	•	Contributing
	•	License
	•	Acknowledgments

Demo

Click here to view a live demo of the visualization. (Note: Insert link to hosted demo if available.)

Features

	•	Interactive Globe Visualization: A 3D rotating globe with data bars representing energy consumption and CO₂ emissions.
	•	Real-Time Data Filtering:
	•	Data Type Selection: Toggle between viewing energy consumption and CO₂ emissions.
	•	Region Filtering: Filter data by specific regions (e.g., Asia, Europe, North America).
	•	Dynamic Floating Tooltips: Hover over data bars to see detailed information about each country.
	•	User-Friendly Controls:
	•	Orbit Controls: Click and drag to rotate the globe.
	•	Zooming: Use the mouse wheel or touch gestures to zoom in and out.
	•	Responsive Design: Optimized for both desktop and mobile devices.
	•	Smooth Color Gradients: Utilizes D3’s color scales for visually appealing gradients based on data values.
	•	Scalable Data Integration: Easily expand the dataset to include more countries or additional data metrics.

Installation

Prerequisites

	•	A modern web browser (Chrome, Firefox, Edge, or Safari) with JavaScript enabled.
	•	A local web server to serve the files (necessary due to browser security policies).

Steps

1. Clone the repository:

git clone https://github.com/your-username/ai-energy-consumption.git

2. Navigate to the project directory:

cd ai-energy-consumption

3. Start a local web server:
You can use any local web server. Here are a few options:

•	Python 3

python -m http.server 8000

•	Node.js (http-server)
Install http-server globally if you haven’t:

npm install -g http-server

Then start the server:

http-server -p 8000

•	Live Server Extension (Visual Studio Code)
If you use VS Code, you can use the Live Server extension to serve the files.

4. Open your browser and navigate to:

http://localhost:8000

Usage

	•	Interact with the Globe:
	•	Rotate: Click and drag the globe to rotate it.
	•	Zoom: Use the mouse wheel or pinch gestures to zoom in and out.
	•	Use the Controls:
	•	Data Type: Select either “Energy Consumption” or “CO₂ Emissions” from the dropdown to switch the data view.
	•	Region: Choose a specific region to filter the data displayed on the globe.
	•	View Data Details:
	•	Hover: Move your cursor over a data bar to see a tooltip with detailed information about the country.
	•	Tooltip Information: Displays the country name and the corresponding data value based on the selected data type.

Data

The data used in this visualization is stored in ai_energy_consumption_data.json. It includes the following fields for each country:

	•	country: Name of the country.
	•	region: Geographical region the country belongs to.
	•	energyConsumed: Annual energy consumption attributed to AI technologies (in kilowatt-hours).
	•	co2Emissions: Annual CO₂ emissions attributed to AI technologies (in metric tons).
	•	year: The year the data represents.
	•	latitude: Latitude coordinate of the country.
	•	longitude: Longitude coordinate of the country.

Adding More Data

To expand the dataset:

	1.	Open ai_energy_consumption_data.json.
	2.	Add new country entries following the existing structure.
	3.	Ensure each new entry includes all the required fields.

Project Structure

ai-energy-visualization/
├── index.html
├── js/
│   └── ai_energy_consumption_prototype.js
├── ai_energy_consumption_data.json
├── assets/
│   ├── earth_texture.jpg
│   └── starfield_texture.jpg
├── css/
│   └── (optional custom stylesheets)
└── README.md

	•	index.html: The main HTML file containing the structure of the web page.
	•	js/ai_energy_consumption_prototype.js: JavaScript file handling data fetching and visualization logic.
	•	ai_energy_consumption_data.json: JSON file containing the data for the visualization.
	•	assets/: Directory for storing any additional assets like images or 3D models.
	•	css/: Directory for custom CSS files (if needed).
	•	README.md: Documentation and instructions for the project.

Contributing

We welcome contributions to this project! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

License

This project is licensed under the MIT License. See the LICENSE file for more details.

Acknowledgments

	•	Libraries and Frameworks:
	•	A-Frame
	    •	D3.js
	    •	A-Frame Extras
	•	Data Sources:
	    •	World Economic Forum
	    •	OECD
	    •	AI Now Institute
	•	Inspiration:
	    •	Thanks to all the open-source contributors and the community for providing valuable resources and examples.

Feel free to reach out if you have any questions or need assistance with the project.