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

function projectDetailsChart(project, type, labels, values1, values2) {
	'use strict';

	var color = type === 'progress' ? '#9c2ca3' : '#ffa500';
	var chartId = type === 'progress' ? 'projectDetailsProgressChart' : 'projectDetailsUsersChart';
	var yLabel1 = type === 'progress' ? 'Overall Progress (%)' : 'Total number of participants';
	var yLabel2 = type === 'progress' ? 'Increase in progress (%)' : 'Increase in number of participants';
	var title = type === 'progress' ? 'Progress for Project: ' : 'Number of participants for Project: ';
	var tooltipSuffix = type === 'progress' ? '%' : '';

	var myChart = new Chart($('#' + chartId), {
		type: 'line',
		data: {
			labels: labels,
			datasets: [{
					label: yLabel1,
					data: values1,
					fill: false,
					backgroundColor: color,
					borderColor: color,
					yAxisID: 'yAxis1'
				},
				{
					label: yLabel2,
					data: values2,
					fill: false,
					backgroundColor: '#ff6384',
					borderColor: '#ff6384',
					yAxisID: 'yAxis2'
				}
			]
		},
		options: {
			maintainAspectRatio: false,
			scales: {
				xAxes: [{
					scaleLabel : {
						display: true,
						labelString: 'Date'
					}
				}],
				yAxes: [{
					id: 'yAxis1',
					position: 'left',
					scaleLabel : {
						display: true,
						labelString: yLabel1
					}
				},
				{
					id: 'yAxis2',
					position: 'right',
					scaleLabel : {
						display: true,
						labelString: yLabel2
					}
				}]
			},
			title: {
				display: true,
				text: title + project
			},
			tooltips: {
				callbacks: {
					label: function(tooltipItem, data) {
						return project + ': ' + tooltipItem.yLabel + tooltipSuffix;
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
		var weeklyprogress = '';
		var colorClassIndex = '';
		$.each(data.feed.entry, function(index, row) {
			progress = row.gsx$progress.$t.replace('%', '');
			weeklyprogress = row.gsx$daytotalchange.$t;
			colorClassIndex = Math.max(0, Math.floor((30 * progress) / 100) - 1);
			dataRows[index] = { projectVal: row.gsx$project.$t, project: projectDetailsLink(row.gsx$project.$t, row.gsx$sheetindex.$t), progressVal: progress, progress: getProgressBar(progress, colorClass[colorClassIndex]), weeklyprogressVal: weeklyprogress.replace('%', ''), weeklyprogress: weeklyprogress, daysToCompletionVal: row.gsx$estimateddaystocompletion.$t, daysToCompletion: row.gsx$estimatedcompletion.$t, completionDate: row.gsx$estimatedcompletiondate.$t, lastUpdated: row.gsx$lastupdated.$t};
		});
		$('#projectSummaryTable').bootstrapTable({data: dataRows, formatNoMatches: function () {return 'No data found.';}});
		$('#projectSummaryTable').show();

		var dates = data.feed.entry.map(function (e) {
			return e.gsx$lastupdated.$t;
		});
		$('#projectSummaryTitle').html('Last updated on ' + dates.sort().pop() + '.');
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
		alert('Unable to get data for project.');
		return;
	}

	$.getJSON(datasourceLink(projectId))
	.done(function(data) {
		var labels = data.feed.entry.map(function (e) {
			return e.gsx$date.$t;
		});

		// Progress
		var progress = data.feed.entry.map(function (e) {
			return e.gsx$completed.$t.replace('%','');
		});

		// Change in Progress
		var changeInProgress = data.feed.entry.map(function (e) {
			return e.gsx$changeincompletion.$t.replace('%','');
		});

		// Users
		var users = data.feed.entry.map(function (e) {
			return e.gsx$totalusers.$t;
		});

		// Change in Users
		var changeInUsers = data.feed.entry.map(function (e) {
			return e.gsx$changeinusers.$t;
		});

		// Draw charts
		projectDetailsChart(project, 'progress', labels, progress, changeInProgress);
		projectDetailsChart(project, 'users', labels, users, changeInUsers);
		$('#projectDetailsTitle').html('Progress and participation rates for project ' + project + '.');
	})
	.fail(function(data) {
		// The project specified in the URL does not point to a valid project or there isn't data yet
		alert('Unable to get data for project.');
	})
	.always(function(data) {
		//alert('always');
	});
}

$(document).ready(function () {
	'use strict';
	// All projects summary
	var page = window.location.pathname.split('/').pop();
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