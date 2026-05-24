const LIVE_DATA_URL = 'https://api.carbonintensity.org.uk/regional';
const PROVENANCE_URL = 'data_provenance.json';

const REGION_COORDINATES = {
    1: { latitude: 57.5, longitude: -4.0, group: 'Scotland' },
    2: { latitude: 55.9, longitude: -3.7, group: 'Scotland' },
    3: { latitude: 54.2, longitude: -2.8, group: 'England' },
    4: { latitude: 54.9, longitude: -1.8, group: 'England' },
    5: { latitude: 53.8, longitude: -1.4, group: 'England' },
    6: { latitude: 53.1, longitude: -3.3, group: 'Wales' },
    7: { latitude: 51.6, longitude: -3.7, group: 'Wales' },
    8: { latitude: 52.5, longitude: -2.2, group: 'England' },
    9: { latitude: 52.9, longitude: -1.2, group: 'England' },
    10: { latitude: 52.2, longitude: 0.6, group: 'England' },
    11: { latitude: 50.7, longitude: -3.6, group: 'England' },
    12: { latitude: 51.1, longitude: -1.2, group: 'England' },
    13: { latitude: 51.5, longitude: -0.1, group: 'England' },
    14: { latitude: 51.2, longitude: 0.5, group: 'England' }
};

const FALLBACK_PROVENANCE = {
    summary: 'Live Great Britain regional carbon intensity data from the NESO Carbon Intensity API.',
    fields: {},
    limitations: [
        'This feed covers Great Britain electricity-system regions only.',
        'Values describe grid context, not AI-attributed energy use.'
    ],
    referenceSources: []
};

window.onload = function() {
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }

    Promise.all([
        fetchLiveGridData(),
        fetchJson(PROVENANCE_URL).catch(error => {
            console.warn('Data provenance failed to load:', error);
            return FALLBACK_PROVENANCE;
        })
    ])
        .then(([liveData, provenance]) => {
            initVisualization(liveData.records, provenance || FALLBACK_PROVENANCE, liveData.metadata);
        })
        .catch(error => {
            console.error('Error loading live grid data:', error);
            renderFatalDataError(error);
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

    function fetchLiveGridData() {
        return fetchJson(LIVE_DATA_URL).then(payload => {
            const interval = payload?.data?.[0];
            if (!interval || !Array.isArray(interval.regions)) {
                throw new Error('Carbon Intensity API returned an unexpected response shape.');
            }

            return {
                metadata: {
                    sourceName: 'NESO Carbon Intensity API',
                    sourceUrl: 'https://carbon-intensity.github.io/api-definitions/',
                    from: interval.from,
                    to: interval.to,
                    fetchedAt: new Date().toISOString()
                },
                records: normalizeLiveRegions(interval.regions)
            };
        });
    }

    function normalizeLiveRegions(regions) {
        return regions
            .filter(region => REGION_COORDINATES[region.regionid])
            .map(region => {
                const coordinates = REGION_COORDINATES[region.regionid];
                const generationMix = region.generationmix || [];
                const mixByFuel = Object.fromEntries(generationMix.map(item => [item.fuel, Number(item.perc) || 0]));
                const renewablePercentage = sumMix(mixByFuel, ['biomass', 'hydro', 'solar', 'wind']);
                const lowCarbonPercentage = sumMix(mixByFuel, ['biomass', 'hydro', 'nuclear', 'solar', 'wind']);
                const gasPercentage = mixByFuel.gas || 0;

                return {
                    country: region.shortname,
                    region: coordinates.group,
                    regionId: region.regionid,
                    operatorRegion: region.dnoregion,
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    carbonIntensity: Number(region.intensity && region.intensity.forecast) || 0,
                    intensityIndex: region.intensity && region.intensity.index,
                    renewablePercentage: roundMetric(renewablePercentage),
                    lowCarbonPercentage: roundMetric(lowCarbonPercentage),
                    gasPercentage: roundMetric(gasPercentage),
                    generationMix
                };
            });
    }

    function sumMix(mixByFuel, fuels) {
        return fuels.reduce((total, fuel) => total + (mixByFuel[fuel] || 0), 0);
    }

    function roundMetric(value) {
        return Math.round(value * 10) / 10;
    }

    function renderFatalDataError(error) {
        const dataStatus = document.getElementById('dataStatus');
        if (dataStatus) {
            dataStatus.innerText = `Live grid data could not be loaded. ${error.message}`;
        }
    }

    function initVisualization(data, provenance, liveMetadata) {
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
        const modalLowCarbon = document.getElementById('modalLowCarbon');
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
        let generationMixChart;
        let lastTooltipUpdate = 0;
        let tooltipLoopStarted = false;
        let activeBars = [];
        const tooltipUpdateInterval = 100;

        renderProvenance();
        setupEventListeners();
        initializeAutocomplete();
        syncMetricOptionLabels();
        updateVisualization();
        resumeGlobeRotation();

        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        function renderProvenance() {
            if (dataStatus) {
                dataStatus.innerText = `${provenance.summary || FALLBACK_PROVENANCE.summary} Current interval: ${formatDateTime(liveMetadata.from)} to ${formatDateTime(liveMetadata.to)}.`;
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
                showSuccessMessage('Live metric changed.');
                updateVisualization();
            });

            regionSelect.addEventListener('change', () => {
                showSuccessMessage('Grid area filter applied.');
                updateVisualization();
            });

            countrySearch.addEventListener('input', debounce(() => {
                showSuccessMessage('Grid region search updated.');
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
            const regionNames = data.map(d => d.country);
            new Awesomplete(countrySearch, {
                list: regionNames,
                minChars: 1,
                maxItems: 10,
                autoFirst: true
            });
        }

        function syncMetricOptionLabels() {
            Array.from(dataTypeSelect.options).forEach(option => {
                option.innerText = formatDataType(option.value);
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
                bar.dataset.region = dataItem.country;

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
                ${dataItem.intensityIndex ? `Intensity: ${dataItem.intensityIndex}` : ''}
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
                ${dataItem.intensityIndex ? `Intensity: ${dataItem.intensityIndex}` : ''}
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
            modalEnergyConsumed.innerText = formatValue(dataItem.carbonIntensity, 'carbonIntensity');
            modalCO2Emissions.innerText = formatValue(dataItem.renewablePercentage, 'renewablePercentage');
            modalLowCarbon.innerText = formatValue(dataItem.lowCarbonPercentage, 'lowCarbonPercentage');
            modalDataNote.innerText = `${dataItem.operatorRegion}. Data interval: ${formatDateTime(liveMetadata.from)} to ${formatDateTime(liveMetadata.to)}. Source: ${liveMetadata.sourceName}.`;
            modalHistoricalNote.innerText = 'Generation mix is sourced from the current NESO regional API response.';

            if (generationMixChart) {
                generationMixChart.destroy();
            }

            const generationMix = dataItem.generationMix.filter(item => Number(item.perc) > 0);
            generationMixChart = new Chart(historicalChartCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: generationMix.map(item => item.fuel),
                    datasets: [{
                        label: 'Current generation mix (%)',
                        data: generationMix.map(item => Number(item.perc) || 0),
                        borderColor: 'rgba(46, 139, 87, 1)',
                        backgroundColor: 'rgba(46, 139, 87, 0.35)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Share of generation (%)'
                            }
                        }
                    }
                }
            });

            infoModal.style.display = 'block';
            trapFocus(infoModal);
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
                carbonIntensity: 'Carbon intensity',
                renewablePercentage: 'Renewables share',
                lowCarbonPercentage: 'Low-carbon share',
                gasPercentage: 'Gas share'
            }[dataType] || dataType;
        }

        function formatValue(value, dataType) {
            if (value == null || !Number.isFinite(Number(value))) {
                return 'N/A';
            }

            const unit = getFieldMeta(dataType).unit;
            const formatted = Number(value).toLocaleString(undefined, {
                maximumFractionDigits: Number(value) < 100 ? 1 : 0
            });

            return unit ? `${formatted} ${unit}` : formatted;
        }

        function formatCompactValue(value, dataType) {
            const unit = getFieldMeta(dataType).unit;
            const formatted = Intl.NumberFormat(undefined, {
                notation: value < 1000 ? 'standard' : 'compact',
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

    function formatDateTime(value) {
        if (!value) return 'unknown';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'unknown';
        return date.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
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
