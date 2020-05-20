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

function projectProgressChart(project, labels, values) {
	'use strict';
	var myChart = new Chart($('#projectDetailsChart'), {
		type: 'line',
		data: {
			labels: labels,
			datasets: [{label: project, data: values, fill: false}]
		},
		options: {
				//responsive: true, // Instruct chart js to respond nicely.
				maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
			//datasets : [{
			//	line: {
			//		showLine: true
			//	}
			//}],
			//legend: {
			//	display: false,
			//},
			scales: {
				xAxes: [{
				//	gridLines: {
				//		display: false,
				//	},
					scaleLabel : {
						display: true,
						labelString: "Date"
					},
				//	ticks: {
				//		stepSize: 1,
				//		max: maxClonesPerRun-1
				//	}
				}],
				yAxes: [{
					scaleLabel : {
						display: true,
						labelString: 'Progress (%)'
					//},
					//ticks: {
						//max: 100,
						//min: 0
					}
				}]
			},
			title: {
				display: true,
				text: 'Progress for Project: ' + project
			},
			tooltips: {
				callbacks: {
					label: function(tooltipItem, data) {
						// Returned formatted tooltip
						return project + ': ' + tooltipItem.yLabel + '%';
					}
				}
			}
		}
	});

	return myChart;
}

function projectDetailsLink(project, sheetIndex) {
	'use strict';
	return `<div><a href="./projectDetails?projectId=${sheetIndex}&project=${project}">${project}</a></div>`;
}

function datasourceLink(sheetIndex) {
	'use strict';
	return `https://spreadsheets.google.com/feeds/list/16HhDEP6eG9sxX0yZd0NbLMgNAjafz_ms88lGUytV6EI/${sheetIndex}/public/full?alt=json`;
}

function projects() {
	'use strict';
	$.getJSON(datasourceLink(1))
	.done(function(data) {
		var dataRows = [];
		var progress = 0.0;
		var colorClassIndex = '';
		$.each(data.feed.entry, function(index, row) {
			progress = row.gsx$progress.$t.replace('%','');
			colorClassIndex = Math.max(0, Math.floor((30 * progress) / 100) - 1);
			dataRows[index] = { projectVal: row.gsx$project.$t, project: projectDetailsLink(row.gsx$project.$t, row.gsx$sheetindex.$t), progressVal: progress, progress: getProgressBar(progress, colorClass[colorClassIndex]), daysToCompletionVal: row.gsx$estimateddaystocompletion.$t, daysToCompletion: row.gsx$estimatedcompletion.$t, completionDate: row.gsx$estimatedcompletiondate.$t};
		});
		$('#projectSummaryTable').bootstrapTable({data: dataRows, formatNoMatches: function () {return 'No data found.';}});
		$('#projectSummaryTable').show();

		//var dateString = new Date(Date.parse(data.feed.updated.$t)).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' });
		//$('#projectSummaryTitle').html('Last updated at ' + dateString);
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
	if (!urlParams.has('project') || !urlParams.has('projectId')) {
		alert('Missing project.');
		return;
	}

	var project = urlParams.get('project');
	var projectId = urlParams.get('projectId');
	if (!Number.isInteger(parseInt(projectId))) {
		alert('Unable to get data for Project');
		return;
	}

	//projectId = parseInt(projectId);
	$.getJSON(datasourceLink(projectId))
	.done(function(data) {
		// Map JSON labels  back to values array
		var labels = data.feed.entry.map(function (e) {
			return e.gsx$date.$t;
		});

		// Map JSON values back to values array
		var values = data.feed.entry.map(function (e) {
			return e.gsx$completed.$t.replace('%','');
		});

		projectProgressChart(project, labels, values);
	})
	.fail(function(data) {
		// The project specified in the URL does not point to a valid project or there isn't data yet
		alert('Unable to get data for project');
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