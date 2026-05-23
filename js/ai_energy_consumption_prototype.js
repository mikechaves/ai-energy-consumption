const DATA_URL = 'ai_energy_consumption_data.json';
const PROVENANCE_URL = 'data_provenance.json';

const FALLBACK_PROVENANCE = {
    summary: 'The bundled records are prototype context values and are not verified AI-attributed country estimates.',
    fields: {},
    limitations: [
        'No authoritative per-country AI-attributed energy estimate is bundled with this prototype.',
        'Use the current values for interaction and storytelling structure only.'
    ],
    referenceSources: []
};

window.onload = function() {
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }

    Promise.all([
        fetchJson(DATA_URL),
        fetchJson(PROVENANCE_URL).catch(error => {
            console.warn('Data provenance failed to load:', error);
            return FALLBACK_PROVENANCE;
        })
    ])
        .then(([data, provenance]) => {
            initVisualization(data, provenance || FALLBACK_PROVENANCE);
        })
        .catch(error => {
            console.error('Error loading visualization data:', error);
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        });

    function fetchJson(url) {
        return fetch(url).then(response => {
            if (!response.ok) {
                throw new Error(`${url} failed with ${response.status}`);
            }
            return response.json();
        });
    }

    function initVisualization(data, provenance) {
        const scene = document.querySelector('a-scene');
        const globe = document.getElementById('globe');
        const cameraRig = document.getElementById('cameraRig');
        const tooltip = document.getElementById('tooltip');
        const instructionOverlay = document.getElementById('instructionOverlay');
        const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
        const dataTypeSelect = document.getElementById('dataTypeSelect');
        const regionSelect = document.getElementById('regionSelect');
        const countrySearch = document.getElementById('countrySearch');
        const dataRange = document.getElementById('dataRange');
        const dataRangeValue = document.getElementById('dataRangeValue');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetViewBtn = document.getElementById('resetViewBtn');
        const infoModal = document.getElementById('infoModal');
        const closeModal = document.getElementById('closeModal');
        const modalCountryName = document.getElementById('modalCountryName');
        const modalEnergyConsumed = document.getElementById('modalEnergyConsumed');
        const modalCO2Emissions = document.getElementById('modalCO2Emissions');
        const modalPopulation = document.getElementById('modalPopulation');
        const modalDataNote = document.getElementById('modalDataNote');
        const modalHistoricalNote = document.getElementById('modalHistoricalNote');
        const historicalChartCanvas = document.getElementById('historicalChart');
        const successMessage = document.getElementById('successMessage');
        const dataStatus = document.getElementById('dataStatus');
        const dataSourceList = document.getElementById('dataSourceList');
        const dataLimitations = document.getElementById('dataLimitations');
        const legendMin = document.getElementById('legendMin');
        const legendMax = document.getElementById('legendMax');

        const THREE = AFRAME.THREE;
        let currentDataType = dataTypeSelect.value;
        let maxValue = getMaxValue(currentDataType);
        let filteredData = [];
        let displayMaxValue = maxValue;
        let historicalChart;
        let lastTooltipUpdate = 0;
        let tooltipLoopStarted = false;
        let activeBars = [];
        const tooltipUpdateInterval = 100;

        renderProvenance();
        setupEventListeners();
        initializeAutocomplete();
        updateVisualization();
        resumeGlobeRotation();

        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        function renderProvenance() {
            if (dataStatus) {
                dataStatus.innerText = provenance.summary || FALLBACK_PROVENANCE.summary;
            }

            renderList(dataLimitations, provenance.limitations);

            if (dataSourceList) {
                dataSourceList.innerHTML = '';
                (provenance.referenceSources || []).forEach(source => {
                    const item = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = source.url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.innerText = source.name;
                    item.appendChild(link);

                    if (source.notes) {
                        item.appendChild(document.createTextNode(` - ${source.notes}`));
                    }

                    dataSourceList.appendChild(item);
                });
            }
        }

        function renderList(container, values) {
            if (!container) return;

            container.innerHTML = '';
            (values || []).forEach(value => {
                const item = document.createElement('li');
                item.innerText = value;
                container.appendChild(item);
            });
        }

        function setupEventListeners() {
            closeInstructionsBtn.addEventListener('click', () => {
                instructionOverlay.style.display = 'none';
            });

            closeModal.addEventListener('click', closeInfoModal);

            window.addEventListener('click', event => {
                if (event.target === infoModal) {
                    closeInfoModal();
                }
            });

            window.addEventListener('keydown', event => {
                if (event.key === 'Escape' && infoModal.style.display === 'block') {
                    closeInfoModal();
                }
            });

            dataTypeSelect.addEventListener('change', () => {
                currentDataType = dataTypeSelect.value;
                maxValue = getMaxValue(currentDataType);
                dataRange.value = 100;
                showSuccessMessage('Context metric changed.');
                updateVisualization();
            });

            regionSelect.addEventListener('change', () => {
                showSuccessMessage('Region filter applied.');
                updateVisualization();
            });

            countrySearch.addEventListener('input', debounce(() => {
                showSuccessMessage('Country search updated.');
                updateVisualization();
            }, 300));

            dataRange.addEventListener('input', () => {
                if (Number(dataRange.value) === 0) {
                    dataRange.value = 1;
                }

                showSuccessMessage('Value filter updated.');
                updateVisualization();
            });

            zoomInBtn.addEventListener('click', () => zoomCamera(-1));
            zoomOutBtn.addEventListener('click', () => zoomCamera(1));
            resetViewBtn.addEventListener('click', resetView);

            cameraRig.addEventListener('componentchanged', event => {
                if (event.detail.name === 'position') {
                    adjustLOD();
                }
            });

            window.addEventListener('resize', positionAllTooltips);
        }

        function initializeAutocomplete() {
            const countryNames = data.map(d => d.country);
            new Awesomplete(countrySearch, {
                list: countryNames,
                minChars: 1,
                maxItems: 10,
                autoFirst: true
            });
        }

        function updateVisualization() {
            const rangePercentage = Math.max(Number(dataRange.value) / 100, 0.01);
            const rangeMaxValue = maxValue * rangePercentage;
            const regionValue = regionSelect.value;
            const searchTerm = countrySearch.value.toLowerCase();
            dataRangeValue.innerText = `${dataRange.value}% (${formatCompactValue(rangeMaxValue, currentDataType)})`;

            filteredData = data.filter(d => {
                const value = Number(d[currentDataType]);
                if (!Number.isFinite(value)) return false;

                const regionMatch = regionValue === 'All' || d.region === regionValue;
                const searchMatch = !searchTerm || d.country.toLowerCase().includes(searchTerm);
                const rangeMatch = value <= rangeMaxValue;
                const validCoordinates = d.latitude != null && d.longitude != null;
                return regionMatch && searchMatch && rangeMatch && validCoordinates;
            });

            displayMaxValue = d3.max(filteredData, d => d[currentDataType]) || 1;
            const colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([0, displayMaxValue]);

            createBars(colorScale);
            updateLegend(displayMaxValue, colorScale);
            positionAllTooltips();
            startTooltipLoop();
        }

        function createBars(colorScale) {
            activeBars.forEach(bar => {
                if (bar.tooltipLabel) {
                    bar.tooltipLabel.remove();
                }
                bar.remove();
            });
            activeBars = [];

            filteredData.forEach(dataItem => {
                const value = Number(dataItem[currentDataType]);
                const barHeight = (value / displayMaxValue) * 2 + 0.1;
                const barPosition = latLongToVector3(dataItem.latitude, dataItem.longitude, 3);
                const bar = document.createElement('a-cylinder');

                bar.setAttribute('radius', 0.05);
                bar.setAttribute('height', barHeight);
                bar.setAttribute('color', colorScale(value));
                bar.setAttribute('class', 'data-bar');
                bar.dataset.country = dataItem.country;

                bar.object3D.quaternion.copy(computeBarRotation(barPosition));
                bar.object3D.position.copy(
                    barPosition.clone().add(barPosition.clone().normalize().multiplyScalar(barHeight / 2))
                );

                bar.addEventListener('mouseenter', () => {
                    showHoverTooltipAtPosition(dataItem, bar);
                    pauseGlobeRotation();
                });

                bar.addEventListener('mouseleave', () => {
                    hideHoverTooltip();
                    resumeGlobeRotation();
                });

                bar.addEventListener('click', () => openInfoModal(dataItem));

                globe.appendChild(bar);
                activeBars.push(bar);
                createTooltipLabel(dataItem, bar);
            });
        }

        function createTooltipLabel(dataItem, barElement) {
            const label = document.createElement('div');
            label.classList.add('tooltip-label');
            label.innerHTML = `
                <strong>${dataItem.country}</strong><br/>
                ${formatDataType(currentDataType)}: ${formatValue(dataItem[currentDataType], currentDataType)}<br/>
                Population: ${formatValue(dataItem.population, 'population')}
            `;
            document.body.appendChild(label);
            barElement.tooltipLabel = label;
        }

        function positionAllTooltips() {
            if (!scene.camera) return;

            activeBars.forEach(barElement => {
                if (!barElement.tooltipLabel) return;

                const barPosition = new THREE.Vector3();
                barElement.object3D.getWorldPosition(barPosition);
                const vector = barPosition.project(scene.camera);
                const canvas = scene.canvas;
                const widthHalf = canvas.clientWidth / 2;
                const heightHalf = canvas.clientHeight / 2;

                barElement.tooltipLabel.style.left = `${(vector.x * widthHalf) + widthHalf}px`;
                barElement.tooltipLabel.style.top = `${-(vector.y * heightHalf) + heightHalf}px`;
                barElement.tooltipLabel.classList.toggle('visible', vector.z < 1);
            });
        }

        function startTooltipLoop() {
            if (tooltipLoopStarted) return;
            tooltipLoopStarted = true;
            requestAnimationFrame(positionAllTooltipsThrottled);
        }

        function positionAllTooltipsThrottled(timestamp) {
            if (timestamp - lastTooltipUpdate >= tooltipUpdateInterval) {
                lastTooltipUpdate = timestamp;
                positionAllTooltips();
            }

            requestAnimationFrame(positionAllTooltipsThrottled);
        }

        function showHoverTooltipAtPosition(dataItem, barElement) {
            tooltip.innerHTML = `
                <strong>${dataItem.country}</strong><br/>
                ${formatDataType(currentDataType)}: ${formatValue(dataItem[currentDataType], currentDataType)}<br/>
                Population: ${formatValue(dataItem.population, 'population')}
            `;

            const barPosition = new THREE.Vector3();
            barElement.object3D.getWorldPosition(barPosition);
            const vector = barPosition.project(scene.camera);
            const canvas = scene.canvas;
            const widthHalf = canvas.clientWidth / 2;
            const heightHalf = canvas.clientHeight / 2;

            tooltip.style.left = `${(vector.x * widthHalf) + widthHalf}px`;
            tooltip.style.top = `${-(vector.y * heightHalf) + heightHalf - 40}px`;
            tooltip.classList.add('show');
        }

        function hideHoverTooltip() {
            tooltip.classList.remove('show');
        }

        function openInfoModal(dataItem) {
            modalCountryName.innerText = dataItem.country;
            modalEnergyConsumed.innerText = formatValue(dataItem.energyConsumed, 'energyConsumed');
            modalCO2Emissions.innerText = formatValue(dataItem.co2Emissions, 'co2Emissions');
            modalPopulation.innerText = formatValue(dataItem.population, 'population');
            modalDataNote.innerText = provenance.summary || FALLBACK_PROVENANCE.summary;
            modalHistoricalNote.innerText = 'Trend chart is illustrative only and does not represent source-verified historical data.';

            const historicalData = generateIllustrativeTrend(dataItem);
            if (historicalChart) {
                historicalChart.destroy();
            }

            historicalChart = new Chart(historicalChartCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: historicalData.labels,
                    datasets: [{
                        label: `${formatDataType(currentDataType)} - illustrative trend only`,
                        data: historicalData.values,
                        borderColor: 'rgba(46, 139, 87, 1)',
                        backgroundColor: 'rgba(46, 139, 87, 0.18)',
                        fill: true,
                        tension: 0.2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Illustrative period'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: formatDataType(currentDataType)
                            }
                        }
                    }
                }
            });

            infoModal.style.display = 'block';
            trapFocus(infoModal);
        }

        function generateIllustrativeTrend(dataItem) {
            const value = Number(dataItem[currentDataType]) || 0;
            const factors = [0.72, 0.76, 0.81, 0.84, 0.88, 0.92, 0.95, 0.97, 0.99, 1];
            return {
                labels: factors.map((_, index) => `T-${factors.length - index - 1}`).slice(0, -1).concat('T'),
                values: factors.map(factor => Math.round(value * factor))
            };
        }

        function closeInfoModal() {
            infoModal.style.display = 'none';
        }

        function updateLegend(value, colorScale) {
            const canvas = document.getElementById('legendCanvas');
            const context = canvas.getContext('2d');
            const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
            const steps = 100;

            context.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i <= steps; i++) {
                const stepValue = (i / steps) * value;
                gradient.addColorStop(i / steps, colorScale(stepValue));
            }

            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);

            legendMin.innerText = '0';
            legendMax.innerText = formatCompactValue(value, currentDataType);
        }

        function resetView() {
            globe.setAttribute('rotation', '0 0 0');
            cameraRig.setAttribute('position', '0 0 10');
            cameraRig.setAttribute('rotation', '0 0 0');

            const camera = cameraRig.querySelector('[camera]');
            const lookControls = camera.components['look-controls'];
            if (lookControls) {
                lookControls.pitchObject.rotation.x = 0;
                lookControls.yawObject.rotation.y = 0;
            }

            dataRange.value = 100;
            showSuccessMessage('View reset.');
            updateVisualization();
        }

        function zoomCamera(direction) {
            const currentPosition = cameraRig.getAttribute('position');
            const newZ = Math.min(Math.max(Number(currentPosition.z) + direction, 5), 20);
            cameraRig.setAttribute('position', `0 0 ${newZ}`);
        }

        function adjustLOD() {
            const cameraPosition = cameraRig.getAttribute('position');
            const showBars = Number(cameraPosition.z) <= 15;
            activeBars.forEach(bar => {
                bar.setAttribute('visible', showBars ? 'true' : 'false');
            });
        }

        function pauseGlobeRotation() {
            globe.removeAttribute('animation__rotation');
        }

        function resumeGlobeRotation() {
            globe.setAttribute('animation__rotation', {
                property: 'rotation',
                to: '0 360 0',
                loop: true,
                dur: 60000,
                easing: 'linear'
            });
        }

        function latLongToVector3(lat, lon, radius) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            return new THREE.Vector3(
                -radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
            );
        }

        function computeBarRotation(vector) {
            const up = new THREE.Vector3(0, 1, 0);
            return new THREE.Quaternion().setFromUnitVectors(up, vector.clone().normalize());
        }

        function getMaxValue(dataType) {
            return d3.max(data, d => Number(d[dataType])) || 1;
        }

        function formatDataType(dataType) {
            return getFieldMeta(dataType).label || {
                energyConsumed: 'National energy context',
                co2Emissions: 'National CO2 context',
                energyPerCapita: 'Energy context per capita',
                co2PerCapita: 'CO2 context per capita',
                population: 'Population'
            }[dataType] || dataType;
        }

        function formatValue(value, dataType) {
            if (value == null || !Number.isFinite(Number(value))) {
                return 'N/A';
            }

            const unit = getFieldMeta(dataType).unit;
            const formatted = Number(value).toLocaleString(undefined, {
                maximumFractionDigits: Number(value) < 100 ? 2 : 0
            });

            if (!unit || dataType === 'population') {
                return formatted;
            }

            return `${formatted} ${unit}`;
        }

        function formatCompactValue(value, dataType) {
            const unit = getFieldMeta(dataType).unit;
            const formatted = Intl.NumberFormat(undefined, {
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(value);

            return unit ? `${formatted} ${unit}` : formatted;
        }

        function getFieldMeta(dataType) {
            return (provenance.fields && provenance.fields[dataType]) || {};
        }

        function showSuccessMessage(message) {
            if (!successMessage) return;

            successMessage.innerText = message;
            successMessage.style.display = 'block';
            window.clearTimeout(showSuccessMessage.timeoutId);
            showSuccessMessage.timeoutId = window.setTimeout(() => {
                successMessage.style.display = 'none';
            }, 1800);
        }
    }

    function debounce(func, delay) {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function trapFocus(modal) {
        const focusableElements = modal.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];

        if (!firstElement) return;

        if (!modal.dataset.focusTrapBound) {
            modal.addEventListener('keydown', handleModalFocusTrap);
            modal.dataset.focusTrapBound = 'true';
        }

        firstElement.focus();
    }

    function handleModalFocusTrap(event) {
        const isTabPressed = event.key === 'Tab' || event.keyCode === 9;

        if (!isTabPressed) {
            return;
        }

        const focusableElements = event.currentTarget.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
        }
    }
};
