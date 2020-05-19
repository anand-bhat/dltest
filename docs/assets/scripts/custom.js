var colorClass = {
	0: '#FF0000',
	1: '#FF1100',
	2: '#FF2300',
	3: '#FF3400',
	4: '#FF4600',
	5: '#FF5700',
	6: '#FF6900',
	7: '#FF7B00',
	8: '#FF8C00',
	9: '#FF9E00',
	10: '#FFAF00',
	11: '#FFC100',
	12: '#FFD300',
	13: '#FFE400',
	14: '#FFF600',
	15: '#F7FF00',
	16: '#E5FF00',
	17: '#D4FF00',
	18: '#C2FF00',
	19: '#B0FF00',
	20: '#9FFF00',
	21: '#8DFF00',
	22: '#7CFF00',
	23: '#6AFF00',
	24: '#58FF00',
	25: '#47FF00',
	26: '#35FF00',
	27: '#24FF00',
	28: '#12FF00',
	29: '#00FF00'
};

function getProgressBar(percentage, color) {
	'use strict';
	return `<div class="progress"><div class="progress-bar role="progressbar" style="width: ${percentage}%; background-color: ${color}" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div></div>`;
}

function prcg2Chart(projectId, runId, maxClonesPerRun, maxGensPerClone, dataSeries) {
	'use strict';
	var myChart = new Chart($('#prcg2Chart'), {
		type: 'scatter',
		data: {
			datasets: dataSeries,
		},
		options: {
				//responsive: true, // Instruct chart js to respond nicely.
				maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
			datasets : [{
				line: {
					showLine: true
				}
			}],
			legend: {
				display: false,
			},
			scales: {
				xAxes: [{
					gridLines: {
						display: false,
					},
					scaleLabel : {
						display: true,
						labelString: "Clone #"
					},
					ticks: {
						stepSize: 1,
						max: maxClonesPerRun-1
					}
				}],
				yAxes: [{
					scaleLabel : {
						display: true,
						labelString: "Gen #"
					},
					ticks: {
						max: maxGensPerClone
					}
				}]
			},
			title: {
				display: true,
				text: 'Progress for Project: ' + projectId + '; Run: ' + runId
			},
			tooltips: {
				callbacks: {
					label: function(tooltipItem, data) {
						// Returned formatted tooltip
						return 'Clone: ' + tooltipItem.xLabel + '; Gen: ' + tooltipItem.yLabel + ' (' + ((tooltipItem.yLabel/maxGensPerClone) * 100) + '%)';
					}
				},
				filter: function (tooltipItem, data) {
					// Hide tooltip for first coordinate
					return !(tooltipItem.index == 0);
				}
			}
		}
	});

	return myChart;
}

function prcgProgress2Link(project, run) {
	'use strict';
	return `<div><a href="./prcgProgress2?project=${project}&run=${run}">Link</a></div>`;
}

function projects() {
	'use strict';
	$.getJSON('https://spreadsheets.google.com/feeds/list/16HhDEP6eG9sxX0yZd0NbLMgNAjafz_ms88lGUytV6EI/1/public/full?alt=json')
	.done(function(data) {
		var dateString = new Date(Date.parse(data.feed.updated.$t)).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' });
		$('#projectSummaryTitle').html('Last updated at ' + dateString);

		var dataRows = [];
		var percentage = 0.0;
		var colorClassIndex = '';
		$.each(data.feed,entry, function(index, row) {
			percentage = row.gsx$progress.$t.replace('%','');
			dataRows[index] = { project: row.gsx$project.$t, details: prcgProgress2Link(1, 2), progress: getProgressBar(percentage, colorClass[colorClassIndex]), average: row.gsx$dayaveragechange.$t, daysToCompletion: row.gsx$estimateddaystocompletion.$t, daysToCompletionNice: row.gsx$estimatedcompletion.$t, completionDate: gsx$estimatedcompletiondate.$t };
		});
		$('#projectSummaryTable').bootstrapTable({data: dataRows, formatNoMatches: function () {return 'No data found.';}});
		$('#projectSummaryTable').show();
	})
	.fail(function(data) {
		// The project specified in the URL does not point to a valid project or there isn't data yet
		alert('Unable to get data.');
	})
	.always(function(data) {
		//alert('always');
	});
}

function projectDetails() {
	'use strict';
	var urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.has('project')) {
		alert('Missing project ID');
		return;
	}
	if (!urlParams.has('run')) {
		alert('Missing run ID');
		return;
	}

	var projectId = urlParams.get('project');
	if (!Number.isInteger(parseInt(projectId))) {
		alert('Unable to get data for Project: ' + projectId);
		return;
	}

	var runId = urlParams.get('run');
	if (!Number.isInteger(parseInt(runId))) {
		alert('Unable to get data for Project: ' + projectId + '; Run: ' + runId);
		return;
	}

	projectId = parseInt(projectId);
	runId = parseInt(runId);

	$.getJSON("../assets/data/" + projectId + ".json")
	.done(function(data) {
		var runData = data.runs.find(run=>run.run==runId);
		if (!runData) {
			alert('Unable to get data for Project: ' + projectId + '; Run: ' + runId);
			return;
		}

		$('#prcg2Title').html('Progress for Project: ' + projectId + '; Run: ' + runId + '. Last updated at ' + new Date(data.lastUpdated).toLocaleString());

		var dataSeries = [];
		var dataRows = [];
		var totalGensCompleted = 0;
		var percentage = 0.0;
		var colorClassIndex = '';
		$.each(runData.clones, function(index, clone) {
			var genCount = clone.gen + 1;
			colorClassIndex = Math.max(0, Math.floor((30 * genCount) / data.maxGensPerClone) - 1);
			percentage =  Math.round((((100 * genCount) / data.maxGensPerClone) + Number.EPSILON) * 100) / 100;
			dataSeries[index] = { data: [{x: clone.clone, y: 0}, {x: clone.clone, y: Math.max(0, clone.gen)}], borderColor: colorClass[colorClassIndex], backgroundColor:colorClass[colorClassIndex] };
			dataRows[index] = { clone: clone.clone, gen: clone.gen === -1 ? '-':clone.gen, remaining: (data.maxGensPerClone - genCount), progress: getProgressBar(percentage, colorClass[colorClassIndex]) };
			totalGensCompleted += genCount;
		});
		prcg2Chart(projectId, runId, data.maxClonesPerRun, data.maxGensPerClone, dataSeries);
		$('#prcg2Table').bootstrapTable({data: dataRows, formatNoMatches: function () {return 'No data found.';}});
		var totalGensForRun = data.maxClonesPerRun * data.maxGensPerClone;
		colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompleted) / totalGensForRun) - 1);
		percentage = Math.round((((100 * totalGensCompleted) / totalGensForRun) + Number.EPSILON) * 100) / 100;
		$('#prcg2ProgressBar').html(getProgressBar(percentage, colorClass[colorClassIndex]));
		$('#prcg2Table').show();
		$('#prcg2UpToProject').show();
		$('#prcg2UpToProjectURL').attr('href', './prcgProgress?project=' + projectId);

		if (runId != 0) {
			$('#prcg2PreviousRun').show();
			$('#prcg2PreviousRunURL').attr('href', './prcgProgress2?project=' + projectId + '&run=' + (runId-1));
		}
		if (runId != data.maxRuns-1) {
			$('#prcg2NextRun').show();
			$('#prcg2NextRunURL').attr('href', './prcgProgress2?project=' + projectId + '&run=' + (runId+1));
		}
	})
	.fail(function(data) {
		// The project specified in the URL does not point to a valid project or there isn't data yet
		alert('Unable to get data for Project: ' + projectId);
	})
	.always(function(data) {
		//alert('always');
	});
}

$(document).ready(function () {
	'use strict';
	// All projects summary
	var page = window.location.pathname.split("/").pop();
	if (page === 'projects') {
		projects();
	}

	// Project Details
	if (page === 'projectDetails') {
		projectDetails();
	}

	// Toggle page description visibility
	$('#togglePageDescription').on('click', function (e) {
		e.preventDefault();
		if ($('#pageDescription').is(':visible')) {
			$('#pageDescription').hide();
			$(this).text('Details');
		}
		else {
			$('#pageDescription').show();
			$(this).text('Hide details');
		}
	});

});